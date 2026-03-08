import React from 'react';
import KPIs from './components/KPIs';
import Products from './components/Products';
import Transactions from './components/Transactions';
import LowStock from './components/LowStock';
import GenerateBill from './components/GenerateBill';
import { useLoad } from './hooks/useLoad';
import { listTx, listProducts } from './lib/api';
import type { Product, Transaction } from './types';

export default function App(){
  const [products, reloadProducts] = useLoad<Product[]>(listProducts, []);
  const [tx, reloadTx] = useLoad<Transaction[]>(listTx, []);
  const [productsRefreshKey, setProductsRefreshKey] = React.useState(0);
  const [txRefreshKey, setTxRefreshKey] = React.useState(0);
  const [theme, setTheme] = React.useState<'dark'|'light'>(() =>
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') ? 'light' : 'dark'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const handleBillSaved = async () => {
    await reloadProducts();
    setProductsRefreshKey(k => k + 1);
    await reloadTx();
    setTxRefreshKey(k => k + 1);
  };

  const handleProductChange = async () => {
    await reloadProducts();
    setProductsRefreshKey(k => k + 1);
  };

  const handleTxChange = async () => {
    await reloadProducts();
    setProductsRefreshKey(k => k + 1);
    await reloadTx();
    setTxRefreshKey(k => k + 1);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="h1">Inventory Management System</div>
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <div className="row" style={{marginTop:12}}><KPIs products={products||[]} tx={tx||[]} /></div>
      <div className="row" style={{marginTop:12}}>
        <Products refreshKey={productsRefreshKey} onProductChange={handleProductChange} />
        <LowStock products={products||[]} />
      </div>
      <div className="row" style={{marginTop:12}}>
        <GenerateBill products={products||[]} onSaved={handleBillSaved} />
        <Transactions refreshKey={txRefreshKey} onTxChange={handleTxChange} />
      </div>
    </div>
  );
}
