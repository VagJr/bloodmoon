import test from 'node:test';
import assert from 'node:assert/strict';
import {transferVault} from '../shared/vault.js';
import {placeOrder,fillOrder,cancelOrder} from '../shared/purchase-orders.js';
import {makeItem} from '../shared/progression.js';
test('vault conserves currency, rejects stale requests and invalid amounts',()=>{
 const p={coins:300};transferVault(p,{direction:'deposit',amount:200,version:0});assert.equal(p.coins,100);assert.equal(p.vault.balance,200);
 assert.throws(()=>transferVault(p,{direction:'deposit',amount:10,version:0}));
 for(const amount of [-1,0,.5,Infinity,NaN,201])assert.throws(()=>transferVault(p,{direction:'withdraw',amount,version:1}));
 transferVault(p,{direction:'withdraw',amount:200,version:1});assert.equal(p.coins,300);assert.equal(p.vault.balance,0);
});
test('purchase orders reserve funds and transfer one unbound item exactly once',()=>{
 const world={},buyer={id:'buyer',coins:200,items:[]},seller={id:'seller',coins:0,items:[makeItem('blade',()=> 'piece')]};
 placeOrder(world,buyer,{cardId:'blade',price:100},'order');assert.equal(buyer.coins,100);
 const receipt=fillOrder(world,seller,buyer,{orderId:'order',itemId:'piece'});assert.equal(receipt.tax,7);assert.equal(seller.coins,93);assert.equal(buyer.items.length,1);assert.equal(seller.items.length,0);
 assert.throws(()=>fillOrder(world,seller,buyer,{orderId:'order',itemId:'piece'}));assert.equal(seller.coins,93);
});
test('orders reject bound, worn, locked, wrong and self-deliveries; cancellation refunds once',()=>{
 const world={},buyer={id:'b',coins:200,items:[]},seller={id:'s',coins:0,items:[makeItem('blade',()=> 'piece','starter')]};
 placeOrder(world,buyer,{cardId:'blade',price:100},'order');const item=seller.items[0];
 assert.throws(()=>fillOrder(world,seller,buyer,{orderId:'order',itemId:'piece'}));item.bound=false;item.durability=2;
 assert.throws(()=>fillOrder(world,seller,buyer,{orderId:'order',itemId:'piece'}));item.durability=3;
 assert.throws(()=>fillOrder(world,seller,buyer,{orderId:'order',itemId:'piece'},new Set(['piece'])));
 assert.throws(()=>fillOrder(world,buyer,buyer,{orderId:'order',itemId:'piece'}));assert.throws(()=>cancelOrder(world,seller,'order'));
 cancelOrder(world,buyer,'order');assert.equal(buyer.coins,200);assert.throws(()=>cancelOrder(world,buyer,'order'));
});
