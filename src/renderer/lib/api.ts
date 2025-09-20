import type { Product, Transaction, TxItem } from '../types';
import { applyTransaction, uid } from './utils';

const hasApi = typeof window !== 'undefined' && (window as any).api;

export async function listProducts(): Promise<Product[]> {
  return hasApi ? (window as any).api.products.list() : getLocal<Product[]>('pi.products', []);
}
export async function createProduct(p: Partial<Product>): Promise<{id:number}> {
  if (hasApi) return (window as any).api.products.create(p);
  const list = getLocal<Product[]>('pi.products', []);
  const id = uid(list);
  list.push({ id, sku: p.sku||'', name: p.name||'', category: p.category||'', price: Number(p.price||0), stock: Number(p.stock||0), reorder_level: Number(p.reorder_level||0) });
  setLocal('pi.products', list);
  return { id };
}
export async function updateProduct(p: Product): Promise<{ok:true}> {
  if (hasApi) return (window as any).api.products.update(p);
  const list = getLocal<Product[]>('pi.products', []);
  const i = list.findIndex(x=>x.id===p.id);
  if (i>=0) list[i] = { ...p };
  setLocal('pi.products', list);
  return { ok: true } as const;
}
export async function deleteProduct(id: number): Promise<{ok:true}> {
  if (hasApi) return (window as any).api.products.delete(id);
  const list = getLocal<Product[]>('pi.products', []);
  setLocal('pi.products', list.filter(x=>x.id!==id));
  return { ok: true } as const;
}

export async function listTx(): Promise<Transaction[]> {
  return hasApi ? (window as any).api.tx.list() : getLocal<Transaction[]>('pi.transactions', []);
}
export async function createTx(payload: { type:'purchase'|'sale'; reference?: string; items: TxItem[] }): Promise<{id:number}> {
  if (hasApi) return (window as any).api.tx.create(payload);
  const TKEY='pi.transactions', PKEY='pi.products';
  const L = getLocal<Transaction[]>(TKEY, []);
  const P = getLocal<Product[]>(PKEY, []);
  const id = uid(L);
  const created_at = new Date().toISOString();
  const amount = (payload.items||[]).reduce((s,i)=>s+(Number(i.qty)||0)*(Number(i.unit_price)||0),0);
  L.unshift({ id, type: payload.type, reference: payload.reference, created_at, amount });
  setLocal(TKEY, L);
  const up = applyTransaction(P, { type: payload.type, items: payload.items });
  setLocal(PKEY, up);
  return { id };
}
export async function exportCsv(): Promise<string> {
  if (hasApi) return (window as any).api.exportCsv();
  const prods = getLocal<Product[]>('pi.products', []);
  const h='id,sku,name,category,price,stock,reorder_level\r\n';
  const b=prods.map(p=>[p.id,p.sku,p.name,p.category||'',p.price,p.stock,p.reorder_level].join(',')).join('\r\n');
  return h+b+(b?'\r\n':'');
}

// localStorage helpers
function getLocal<T>(k: string, f: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : f; } catch { return f; }
}
function setLocal(k: string, v: any){ localStorage.setItem(k, JSON.stringify(v)); }