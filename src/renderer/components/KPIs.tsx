import React, { useMemo } from 'react';
import type { Product, Transaction } from '../types';
import { computeTotalValue, lowStockCount } from '../lib/utils';

export default function KPIs({ products, tx }: { products: Product[]; tx: Transaction[] }){
  const totalValue = useMemo(() => computeTotalValue(products||[]), [products]);
  const lowCount = useMemo(() => lowStockCount(products||[]), [products]);
  return (
    <div className="row">
      <div className="card"><div>Total Products</div><div className="kpi">{(products||[]).length}</div></div>
      <div className="card"><div>Total Stock Value</div><div className="kpi">₹{totalValue.toFixed(2)}</div></div>
      <div className="card"><div>Low Stock Items</div><div className="kpi low">{lowCount}</div></div>
      <div className="card"><div>Transactions</div><div className="kpi">{(tx||[]).length}</div></div>
    </div>
  );
}