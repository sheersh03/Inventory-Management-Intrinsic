import React, { useState } from 'react';
import type { TxItem, Product } from '../types';
import { useLoad } from '../hooks/useLoad';
import { listProducts, createTx } from '../lib/api';

export default function TxForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> | void }){
  const [type, setType] = useState<'purchase'|'sale'>('purchase');
  const [reference, setRef] = useState('');
  const [items, setItems] = useState<TxItem[]>([{ product_id: 0 as any, qty: 1, unit_price: 0 }]);
  const [products] = useLoad<Product[]>(listProducts, []);
  const [err, setErr] = useState<string | null>(null);
  const setItem = (i:number,k:keyof TxItem,v:any)=>{ const n=[...items]; (n[i] as any)[k]=v; setItems(n); };
  const addItem = ()=> setItems([...items,{ product_id: 0 as any, qty:1, unit_price:0 }]);
  const validate = ():string|null => {
    if(!items.length) return 'Add at least one line item';
    for(const it of items){ if(!it.product_id) return 'Each line must have a product'; if(Number(it.qty)<=0) return 'Quantity must be greater than 0'; if(Number(it.unit_price)<0) return 'Unit price cannot be negative'; }
    return null;
  };
  const save = async ()=>{ const v=validate(); if(v){ setErr(v); return; } try{ await createTx({ type, reference, items: items.filter(i=>i.product_id) }); await onSaved(); onClose(); }catch(e:any){ setErr(e?.message||'Failed to record'); } };
  return (
    <div className="modal"><div className="content">
      <h3 style={{marginTop:0}}>Record Transaction</h3>
      {err && <div className="low" style={{marginBottom:8}}>{err}</div>}
      <div className="grid2">
        <select className="select" value={type} onChange={e=>setType(e.target.value as any)}>
          <option value="purchase">Purchase (+stock)</option>
          <option value="sale">Sale (−stock)</option>
        </select>
        <input className="input" placeholder="Reference (e.g. INV-123)" value={reference} onChange={e=>setRef(e.target.value)} />
      </div>
      <div style={{marginTop:12}}>
        {items.map((it,idx)=>(
          <div key={idx} className="row" style={{marginBottom:8}}>
            <select className="select" value={it.product_id || ''} onChange={e=>setItem(idx,'product_id',Number(e.target.value))}>
              <option value="">Select product…</option>
              {(products||[]).map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="input" type="number" min={1} value={it.qty} onChange={e=>setItem(idx,'qty',Number(e.target.value))} />
            <input className="input" type="number" min={0} value={it.unit_price} onChange={e=>setItem(idx,'unit_price',Number(e.target.value))} />
          </div>
        ))}
        <button className="btn" onClick={addItem}>+ Add Item</button>
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button className="btn primary" onClick={save}>Save</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </div></div>
  );
}