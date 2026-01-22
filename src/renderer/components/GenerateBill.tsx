import React, { useMemo, useState } from 'react';
import type { Product } from '../types';
import { createTx } from '../lib/api';

type BillRow = {
  product_id: number | '';
  qty: number;
  discount_percent: number;
};

export default function GenerateBill({ products, onSaved }: { products: Product[]; onSaved?: () => Promise<void> | void }) {
  const [items, setItems] = useState<BillRow[]>([{ product_id: '', qty: 1, discount_percent: 0 }]);
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const itemsWithTotals = useMemo(() => {
    return items.map((item) => {
      const product = products.find(p => p.id === item.product_id);
      const price = product?.price ?? 0;
      const qty = Math.max(0, Number(item.qty) || 0);
      const discount = Math.min(100, Math.max(0, Number(item.discount_percent || 0)));
      const subtotal = price * qty;
      const discountAmount = subtotal * (discount / 100);
      const total = subtotal - discountAmount;
      return { ...item, product, price, qty, discount, subtotal, discountAmount, total };
    });
  }, [items, products]);

  const subTotal = useMemo(() => itemsWithTotals.reduce((sum, line) => sum + line.subtotal, 0), [itemsWithTotals]);
  const discountTotal = useMemo(() => itemsWithTotals.reduce((sum, line) => sum + line.discountAmount, 0), [itemsWithTotals]);
  const total = useMemo(() => itemsWithTotals.reduce((sum, line) => sum + line.total, 0), [itemsWithTotals]);

  const updateItem = (index: number, changes: Partial<BillRow>) => {
    setItems(prev => prev.map((line, idx) => idx === index ? { ...line, ...changes } : line));
  };

  const addLine = () => setItems(prev => [...prev, { product_id: '', qty: 1, discount_percent: 0 }]);
  const removeLine = (index: number) => setItems(prev => prev.filter((_, idx) => idx !== index));
  const resetForm = () => {
    setItems([{ product_id: '', qty: 1, discount_percent: 0 }]);
    setReference('');
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    const payloadItems = itemsWithTotals
      .filter(line => line.product_id)
      .map(line => ({
        product_id: line.product_id,
        qty: line.qty,
        unit_price: line.price,
        discount_percent: line.discount
      }));
    if (!payloadItems.length) {
      setError('Add at least one product to the bill.');
      return;
    }
    if (payloadItems.some(line => line.qty <= 0)) {
      setError('Quantity must be greater than zero.');
      return;
    }
    try {
      setLoading(true);
      await createTx({ type: 'sale', reference: reference.trim() || undefined, items: payloadItems });
      resetForm();
      await onSaved?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ minWidth: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Generate bill</h3>
          <small style={{ color: '#9ca3af' }}>Discounts apply per item, billing share shown below.</small>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <input
          className="input"
          placeholder="Reference (optional)"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
      </div>
      {itemsWithTotals.map((line, idx) => (
        <div key={idx} className="row" style={{ marginTop: 12, gap: 10 }}>
          <select
            className="select"
            value={line.product_id || ''}
            onChange={e => updateItem(idx, { product_id: e.target.value ? Number(e.target.value) : '' })}
          >
            <option value="">Select product…</option>
            {products.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.name} — ₹{prod.price}</option>
            ))}
          </select>
          <input className="input" type="number" min={1} value={line.qty} onChange={e => updateItem(idx, { qty: Number(e.target.value) })} />
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={line.discount}
            onChange={e => updateItem(idx, { discount_percent: Number(e.target.value) })}
            placeholder="Discount %"
          />
          <button className="btn" onClick={() => removeLine(idx)} style={{ alignSelf: 'flex-end' }}>×</button>
          <div style={{ flexBasis: '250px', fontSize: '0.85rem', color: '#f3f4f6' }}>
            Line total: ₹{line.total.toFixed(2)} · {total ? ((line.total / total) * 100).toFixed(1) : '0.0'}% of bill
          </div>
        </div>
      ))}
      <button className="btn" style={{ marginTop: 10 }} onClick={addLine}>+ Add item</button>
      <div style={{ marginTop: 14 }}>
        <div className="grid2" style={{ gap: 10 }}>
          <div>
            <div className="muted">Subtotal</div>
            <div className="kpi">₹{subTotal.toFixed(2)}</div>
          </div>
          <div>
            <div className="muted">Discount</div>
            <div className="kpi low">₹{discountTotal.toFixed(2)}</div>
          </div>
          <div>
            <div className="muted">Total</div>
            <div className="kpi">₹{total.toFixed(2)}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <strong>Billing proportions</strong>
          <ul style={{ paddingLeft: 16, margin: '6px 0', color: '#d1d5db' }}>
            {itemsWithTotals.map((line, idx) => {
              if (!line.product_id) return null;
              const share = total ? (line.total / total) * 100 : 0;
              return (
                <li key={`share-${idx}`} style={{ fontSize: '0.8rem' }}>
                  {line.product?.name || `Product #${line.product_id}`}: {share.toFixed(1)}% ({line.qty} pcs)
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {error && <div className="low" style={{ marginTop: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate bill'}
        </button>
        <button className="btn" onClick={resetForm}>Reset</button>
      </div>
    </div>
  );
}
