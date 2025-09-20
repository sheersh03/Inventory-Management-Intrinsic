import type { Product, Transaction } from '../types';

export function uid(list: { id: number }[]): number {
  return (list.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
}

export function computeTotalValue(products: Product[]): number {
  return products.reduce((s, p) => s + (Number(p.price)||0)*(Number(p.stock)||0), 0);
}

export function lowStockCount(products: Product[]): number {
  return products.filter(p => (Number(p.stock)||0) <= (Number(p.reorder_level)||0)).length;
}

export function applyTransaction(products: Product[], tx: Required<Pick<Transaction,'type'|'items'>>): Product[] {
  const mult = tx.type === 'purchase' ? 1 : -1;
  const next = products.map(p=>({...p}));
  for(const it of tx.items||[]){
    const f = next.find(p=>p.id===it.product_id);
    if (f) f.stock = (Number(f.stock)||0) + mult*(Number(it.qty)||0);
  }
  return next;
}