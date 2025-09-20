import React, { useState, type ChangeEvent } from 'react';
import type { Product } from '../types';

export default function ProductForm({ initial, onSubmit, onClose }: { initial?: Product; onSubmit: (p: Partial<Product> | Product) => Promise<any>; onClose: () => void }){
  const [f, setF] = useState<Partial<Product>>(initial || { sku:'', name:'', category:'', price:0, stock:0, reorder_level:0 });
  const [err, setErr] = useState<string | null>(null);
  const change = (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [e.target.name]: e.target.type==='number' ? Number(e.target.value) : e.target.value });
  const validate = (): string | null => {
    if (!String(f.sku||'').trim()) return 'SKU is required';
    if (!String(f.name||'').trim()) return 'Name is required';
    if (Number(f.price) < 0) return 'Price cannot be negative';
    if (Number.isNaN(Number(f.price))) return 'Price must be a number';
    if (Number(f.stock) < 0) return 'Stock cannot be negative';
    if (Number(f.reorder_level) < 0) return 'Reorder level cannot be negative';
    return null;
  };
  const save = async () => { const v=validate(); if(v){ setErr(v); return; } try{ await onSubmit(f as Product); onClose(); } catch(e:any){ setErr(e?.message||'Failed to save'); } };
  return (
    <div className="modal"><div className="content">
      <h3 style={{marginTop:0}}>Product</h3>
      {err && <div className="low" style={{marginBottom:8}}>{err}</div>}
      <div className="grid2">
        <input className="input" name="sku" placeholder="SKU" value={String(f.sku||'')} onChange={change} />
        <input className="input" name="name" placeholder="Name" value={String(f.name||'')} onChange={change} />
        <input className="input" name="category" placeholder="Category" value={String(f.category||'')} onChange={change} />
        <input className="input" type="number" name="price" placeholder="Price" value={Number(f.price||0)} onChange={change} />
        <input className="input" type="number" name="stock" placeholder="Stock" value={Number(f.stock||0)} onChange={change} />
        <input className="input" type="number" name="reorder_level" placeholder="Reorder Level" value={Number(f.reorder_level||0)} onChange={change} />
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button className="btn primary" onClick={save}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </div></div>
  );
}