import React, { useState } from 'react';
import type { Transaction } from '../types';
import { useLoad } from '../hooks/useLoad';
import { listTx } from '../lib/api';
import TxForm from './TxForm';

export default function Transactions(){
  const [rows, reload] = useLoad<Transaction[]>(listTx, []);
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{margin:0}}>Recent Transactions</h3>
        <button className="btn primary" onClick={()=>setOpen(true)}>Record Transaction</button>
      </div>
      <table className="table" style={{marginTop:8}}>
        <thead><tr><th>ID</th><th>Type</th><th>Reference</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          {(rows||[]).map(t=>(
            <tr key={t.id}><td>{t.id}</td><td>{t.type}</td><td>{t.reference}</td><td>₹{Number(t.amount||0).toFixed(2)}</td><td>{new Date(t.created_at).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
      {open && <TxForm onClose={()=>setOpen(false)} onSaved={reload} />}
    </div>
  );
}