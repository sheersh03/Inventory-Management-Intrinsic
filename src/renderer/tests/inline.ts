// Do NOT modify existing tests unless requirements change.
import type { Product } from '../types';
import { computeTotalValue, lowStockCount, applyTransaction, uid } from '../lib/utils';

;(() => {
  try{
    const prods: Product[] = [
      { id:1, sku:'A', name:'Alpha', category:'cat', price:10, stock:5, reorder_level:2 },
      { id:2, sku:'B', name:'Beta',  category:'cat', price:20, stock:0, reorder_level:1 },
    ];
    console.assert(computeTotalValue(prods) === 50, 'Total value should be 50');
    console.assert(lowStockCount(prods) === 1, 'Low stock count should be 1');

    const afterPurchase = applyTransaction(prods, { type:'purchase', items:[{ product_id:2, qty:3, unit_price:20 }] });
    console.assert(afterPurchase.find(p=>p.id===2)!.stock === 3, 'Purchase should add stock');

    const afterSale = applyTransaction(afterPurchase, { type:'sale', items:[{ product_id:1, qty:2, unit_price:10 }] });
    console.assert(afterSale.find(p=>p.id===1)!.stock === 3, 'Sale should reduce stock');

    const multi = applyTransaction(prods, { type:'purchase', items:[{product_id:1, qty:1, unit_price:10},{product_id:2, qty:2, unit_price:20}] });
    console.assert(multi.find(p=>p.id===1)!.stock === 6 && multi.find(p=>p.id===2)!.stock === 2, 'Multiple line items should update each product');

    const noop = applyTransaction(prods, { type:'sale', items:[{product_id:999, qty:5, unit_price:0}] });
    console.assert(noop.find(p=>p.id===1)!.stock === 5 && noop.find(p=>p.id===2)!.stock === 0, 'Unknown product ids must not change stock');

    const lowEdge = lowStockCount([{id:10, sku:'X', name:'Edge', price:0, stock:2, reorder_level:2} as Product]);
    console.assert(lowEdge === 1, 'Equal to reorder level counts as low stock');

    const emptyTotal = computeTotalValue([]);
    console.assert(emptyTotal === 0, 'Empty list total value should be 0');

    const zeroQtyNoChange = applyTransaction(prods, { type:'sale', items:[{product_id:1, qty:0, unit_price:10}] });
    console.assert(zeroQtyNoChange.find(p=>p.id===1)!.stock === 5, 'Zero-qty line must not change stock');

    const decimals = computeTotalValue([{ id:3, sku:'C', name:'Gamma', price:12.5, stock:3, reorder_level:0 } as Product]);
    console.assert(decimals === 37.5, 'Decimal price should be supported');

    const noItemsTx = applyTransaction(prods, { type:'purchase', items:[] });
    console.assert(noItemsTx.find(p=>p.id===1)!.stock === 5 && noItemsTx.find(p=>p.id===2)!.stock === 0, 'Empty transaction should not change stock');

    const immutability = JSON.stringify(prods);
    applyTransaction(prods, { type:'sale', items:[{product_id:1, qty:1, unit_price:10}] });
    console.assert(JSON.stringify(prods) === immutability, 'applyTransaction must not mutate input array');

    const lowZero = lowStockCount([{id:11, sku:'Z', name:'Zero', price:0, stock:0, reorder_level:0} as Product]);
    console.assert(lowZero === 1, 'Stock 0 with reorder_level 0 should be low');

    // Extra tests
    const ids = uid([{id:1},{id:7},{id:3}] as any);
    console.assert(ids === 8, 'uid() should return max(id)+1');

    const idsEmpty = uid([] as any);
    console.assert(idsEmpty === 1, 'uid([]) should return 1');

    const weirdTotal = computeTotalValue([{ id:12, sku:'W', name:'Weird', price: '10' as any, stock: '2' as any, reorder_level: 0 } as any]);
    console.assert(weirdTotal === 20, 'computeTotalValue should coerce numeric strings');

    console.log('%cAll inline tests passed', 'color:#22c55e');
  }catch(e){ console.error('Tests failed', e); }
})();