import React from 'react';
import KPIs from './components/KPIs';
import Products from './components/Products';
import Transactions from './components/Transactions';
import LowStock from './components/LowStock';
import { useLoad } from './hooks/useLoad';
import { listTx, listProducts } from './lib/api';
import type { Product, Transaction } from './types';

export default function App(){
  const [products] = useLoad<Product[]>(listProducts, []);
  const [tx] = useLoad<Transaction[]>(listTx, []);
  return (
    <div className="container">
      <div className="h1">Inventory Management System</div>
      <div className="row" style={{marginTop:12}}><KPIs products={products||[]} tx={tx||[]} /></div>
      <div className="row" style={{marginTop:12}}>
        <Products />
        <LowStock products={products||[]} />
      </div>
      <div className="row" style={{marginTop:12}}><Transactions /></div>
    </div>
  );
}