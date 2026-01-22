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

  const handleBillSaved = async () => {
    await reloadProducts();
    setProductsRefreshKey(k => k + 1);
    await reloadTx();
    setTxRefreshKey(k => k + 1);
  };

  return (
    <div className="container">
      <div className="h1">Inventory Management System</div>
      <div className="row" style={{marginTop:12}}><KPIs products={products||[]} tx={tx||[]} /></div>
      <div className="row" style={{marginTop:12}}>
        <Products refreshKey={productsRefreshKey} />
        <LowStock products={products||[]} />
      </div>
      <div className="row" style={{marginTop:12}}>
        <GenerateBill products={products||[]} onSaved={handleBillSaved} />
        <Transactions refreshKey={txRefreshKey} />
      </div>
    </div>
  );
}
