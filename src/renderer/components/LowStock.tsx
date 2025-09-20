import React from 'react';
import type { Product } from '../types';

export default function LowStock({ products }: { products: Product[] }){
  const list = (products||[]).filter(p=> (Number(p.stock)||0) <= (Number(p.reorder_level)||0));
  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <h3 style={{margin:0}}>Low Stock Alert</h3>
      </div>
      {list.length===0 ? <div>No items expiring soon</div> : (
        <ul>{list.map(p=> <li key={p.id}><span className="badge">{p.sku||'#'}</span> {p.name} — stock {p.stock}</li>)}</ul>
      )}
    </div>
  );
}