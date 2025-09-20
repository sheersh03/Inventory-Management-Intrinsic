export type Product = {
  id: number;
  sku: string;
  name: string;
  category?: string | null;
  price: number;
  stock: number;
  reorder_level: number;
};

export type TxItem = { product_id: number; qty: number; unit_price: number };

export type Transaction = {
  id: number;
  type: 'purchase' | 'sale';
  reference?: string | null;
  created_at: string; // ISO string
  items?: TxItem[];
  amount?: number;
};

declare global {
  interface Window { api?: any; }
};