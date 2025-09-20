import React, { useState } from 'react';
import type { Product } from '../types';
import { useLoad } from '../hooks/useLoad';
import { listProducts, createProduct, updateProduct, deleteProduct, exportCsv } from '../lib/api';
import ProductForm from './ProductForm';

export default function Products(){
  const [rows, reload] = useLoad<Product[]>(listProducts, []);
  const [modal, setModal] = useState<Product | null | undefined>(null);
  const create = async (p: Partial<Product>) => { try{ await createProduct(p); await reload(); } catch(e:any){ alert(e?.message||'Failed to create'); } };
  const update = async (p: Product) => { try{ await updateProduct(p); await reload(); } catch(e:any){ alert(e?.message||'Failed to update'); } };
  const remove = async (id:number) => { if (confirm('Delete product?')) { try{ await deleteProduct(id); await reload(); } catch(e:any){ alert(e?.message||'Failed to delete'); } } };
  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{margin:0}}>Products</h3>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={async()=>{ try{ const csv=await exportCsv(); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='products.csv'; a.click(); }catch(e){ alert('Export failed'); } }}>Export CSV</button>
          <button className="btn primary" onClick={()=>setModal({} as any)}>Add Product</button>
        </div>
      </div>
      <table className="table" style={{marginTop:8}}>
        <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Reorder</th><th></th></tr></thead>
        <tbody>
          {(rows||[]).map(p=> (
            <tr key={p.id}>
              <td>{p.sku}</td><td>{p.name}</td><td>{p.category}</td>
              <td>₹{p.price}</td><td>{p.stock}</td><td>{p.reorder_level}</td>
              <td style={{textAlign:'right'}}>
                <button className="btn" onClick={()=>setModal(p)}>Edit</button>
                <button className="btn" onClick={()=>remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal && (
        <ProductForm initial={modal && (modal as Product).id ? (modal as Product) : undefined}
                     onSubmit={(modal as Product)?.id ? (update as any) : (create as any)}
                     onClose={()=>setModal(null)} />
      )}
    </div>
  );
}