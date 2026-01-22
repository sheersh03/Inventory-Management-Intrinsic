import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

let win: BrowserWindow | null = null;
const ALLOW_NEGATIVE_STOCK = false; // toggle if you want to allow negative inventory

function resolveBaseDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return path.resolve(process.env.PORTABLE_EXECUTABLE_DIR);
  if (app.isPackaged) return path.dirname(app.getPath('exe'));
  return process.cwd();
}

function ensureDb() {
  const baseDir = resolveBaseDir();
  const dataDir = path.join(baseDir, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'inventory.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('purchase','sale')),
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      amount REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tx_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL NOT NULL DEFAULT 0,
      discounted_unit_price REAL NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tx_items_tx ON tx_items(tx_id);
  `);
  const ensureColumn = (table: string, column: string, definition: string) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!info.some((row:any) => row.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    }
  };
  ensureColumn('tx_items', 'discount_percent', 'discount_percent REAL NOT NULL DEFAULT 0');
  ensureColumn('tx_items', 'discounted_unit_price', 'discounted_unit_price REAL NOT NULL DEFAULT 0');
  return db;
}

const db = ensureDb();

const st = {
  products: {
    list: db.prepare(`SELECT id, sku, name, category, price, stock, reorder_level FROM products ORDER BY id DESC`),
    getBySku: db.prepare(`SELECT id FROM products WHERE sku = ?`),
    getStock: db.prepare(`SELECT stock FROM products WHERE id = ?`),
    create: db.prepare(`INSERT INTO products (sku, name, category, price, stock, reorder_level) VALUES (@sku,@name,@category,@price,@stock,@reorder_level)`),
    update: db.prepare(`UPDATE products SET sku=@sku, name=@name, category=@category, price=@price, stock=@stock, reorder_level=@reorder_level WHERE id=@id`),
    del: db.prepare(`DELETE FROM products WHERE id = ?`)
  },
  tx: {
    list: db.prepare(`SELECT id, type, reference, created_at, amount FROM transactions ORDER BY id DESC LIMIT 200`),
    insertTx: db.prepare(`INSERT INTO transactions (type, reference) VALUES (?, ?)`),
    insertItem: db.prepare(`INSERT INTO tx_items (tx_id, product_id, qty, unit_price, discount_percent, discounted_unit_price) VALUES (?,?,?,?,?,?)`),
    addStock: db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`),
    sumItems: db.prepare(`SELECT SUM(qty * discounted_unit_price) as total FROM tx_items WHERE tx_id = ?`),
    updateAmount: db.prepare(`UPDATE transactions SET amount = ? WHERE id = ?`)
  }
};

const createTx = db.transaction((type: 'purchase'|'sale', reference: string | null, items: {product_id:number; qty:number; unit_price:number; discount_percent?: number}[]) => {
  const txInfo = st.tx.insertTx.run(type, reference);
  const txId = Number(txInfo.lastInsertRowid);
  for (const it of items) {
    if (!it.product_id || it.qty <= 0 || it.unit_price < 0) throw new Error('Invalid line item');
    const mult = type === 'purchase' ? 1 : -1;
    if (mult < 0 && !ALLOW_NEGATIVE_STOCK) {
      const current = st.products.getStock.get(it.product_id)?.stock ?? 0;
      if (current - it.qty < 0) throw new Error('Insufficient stock for sale');
    }
    const discount = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
    const discountedUnitPrice = Math.max(0, Number(it.unit_price) * (1 - discount / 100));
    st.tx.insertItem.run(txId, it.product_id, it.qty, it.unit_price, discount, discountedUnitPrice);
    st.tx.addStock.run(mult * it.qty, it.product_id);
  }
  const total = st.tx.sumItems.get(txId).total ?? 0;
  st.tx.updateAmount.run(total, txId);
  return txId;
});

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.resolve(__dirname, '../dist/index.html'));
  }

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('products:list', () => st.products.list.all());
ipcMain.handle('products:create', (_e, p: any) => {
  if (!p?.sku || !p?.name) throw new Error('SKU and Name are required');
  try{
    const info = st.products.create.run({
      sku: String(p.sku),
      name: String(p.name),
      category: p.category ? String(p.category) : null,
      price: Number(p.price||0),
      stock: Number(p.stock||0),
      reorder_level: Number(p.reorder_level||0)
    });
    return { id: Number(info.lastInsertRowid) };
  }catch(err:any){
    if (String(err?.message||'').includes('UNIQUE')) throw new Error('SKU must be unique');
    throw err;
  }
});
ipcMain.handle('products:update', (_e, p: any) => {
  if (!p?.id) throw new Error('ID required');
  st.products.update.run({
    id: Number(p.id),
    sku: String(p.sku||''),
    name: String(p.name||''),
    category: p.category ? String(p.category) : null,
    price: Number(p.price||0),
    stock: Number(p.stock||0),
    reorder_level: Number(p.reorder_level||0)
  });
  return { ok: true };
});
ipcMain.handle('products:delete', (_e, id: number) => { st.products.del.run(Number(id)); return { ok: true }; });

ipcMain.handle('tx:list', () => st.tx.list.all());
(function registerTxCreate(){
  ipcMain.handle('tx:create', (_e, payload: any) => {
    const type = payload?.type === 'sale' ? 'sale' : 'purchase';
    const reference = payload?.reference ? String(payload.reference) : null;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (!items.length) throw new Error('At least one line item required');
    const id = createTx(type, reference, items.map((i:any)=>({
      product_id: Number(i.product_id),
      qty: Number(i.qty),
      unit_price: Number(i.unit_price),
      discount_percent: Number(i.discount_percent||0)
    })));
    return { id };
  });
})();

ipcMain.handle('export:productsCsv', () => {
  const rows = st.products.list.all();
  const header = 'id,sku,name,category,price,stock,reorder_level\r\n';
  const body = rows.map((p:any)=>[p.id,p.sku,p.name,p.category??'',p.price,p.stock,p.reorder_level].join(',')).join('\r\n');
  return header + body + (body ? '\r\n' : '');
});

ipcMain.handle('invoice:generate', async (_e, payload: { invoiceNo: number; html: string }) => {
  const win = new BrowserWindow({
    width: 1000,
    height: 1400,
    show: false,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  try {
    await win.loadURL(`data:text/html;base64,${Buffer.from(payload.html, 'utf8').toString('base64')}`);
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margin: { top: 16, bottom: 16, left: 16, right: 16 }
    });
    const invoicesDir = path.join(resolveBaseDir(), 'bills');
    fs.mkdirSync(invoicesDir, { recursive: true });
    const fileName = `Invoice-${payload.invoiceNo}-${Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  } finally {
    win.close();
  }
});
