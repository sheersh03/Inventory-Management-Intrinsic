import React, { useEffect, useRef, useState } from 'react';
import type { Transaction } from '../types';
import { useLoad } from '../hooks/useLoad';
import { listTx, deleteTx, deleteAllTx } from '../lib/api';

const ANIM_DURATION = 220;

export default function Transactions({ refreshKey, onTxChange }: { refreshKey?: number; onTxChange?: () => void }) {
  const [rows, reload] = useLoad<Transaction[]>(listTx, []);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const initialReload = useRef(true);

  useEffect(() => {
    if (refreshKey === undefined) return;
    if (initialReload.current) {
      initialReload.current = false;
      return;
    }
    void reload();
  }, [refreshKey, reload]);

  const handleDelete = async (id: number) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    await new Promise((r) => setTimeout(r, ANIM_DURATION));
    try {
      await deleteTx(id);
      await reload();
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await onTxChange?.();
    } catch (e: any) {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert(e?.message || 'Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    if (!(rows?.length)) return;
    if (!confirm(`Delete all ${rows.length} transaction(s)? This will restore stock.`)) return;
    setRemovingIds(new Set(rows.map((r) => r.id)));
    await new Promise((r) => setTimeout(r, ANIM_DURATION));
    try {
      await deleteAllTx();
      await reload();
      setRemovingIds(new Set());
      await onTxChange?.();
    } catch (e: any) {
      setRemovingIds(new Set());
      alert(e?.message || 'Failed to delete all');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Recent Transactions</h3>
        <button
          className="btn btn-danger"
          onClick={handleDeleteAll}
          disabled={!rows?.length || removingIds.size > 0}
          title="Delete all transactions"
        >
          Delete All
        </button>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Date</th>
            <th style={{ width: 48, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((t) => (
            <tr
              key={t.id}
              className={removingIds.has(t.id) ? 'tx-row-deleting' : ''}
            >
              <td>{t.id}</td>
              <td>{t.type}</td>
              <td>{t.reference ?? '-'}</td>
              <td>₹{Number(t.amount || 0).toFixed(2)}</td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
              <td style={{ textAlign: 'right', paddingRight: 8 }}>
                <button
                  className="btn btn-icon btn-delete"
                  onClick={() => handleDelete(t.id)}
                  disabled={removingIds.has(t.id)}
                  title="Delete transaction"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
