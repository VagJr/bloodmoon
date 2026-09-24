import {CARDS} from './cards.js';
import {ECONOMY} from './progression.js';
export function placeOrder(world,buyer,{cardId,price},id,now=Date.now()){
 if(CARDS[cardId]?.type!=='equipment'||!Number.isSafeInteger(price)||price<ECONOMY.marketMinPrice||price>ECONOMY.marketMaxPrice)throw new Error('Escolha uma relíquia e um preço válido.');
 const orders=world.purchaseOrders||[];
 if(orders.filter(o=>o.buyerId===buyer.id).length>=3)throw new Error('Você pode manter até três encomendas abertas.');
 if(orders.length>=200)throw new Error('O mural de encomendas está cheio. Tente mais tarde.');
 if((buyer.coins||0)<price)throw new Error('Retire Marcas do cofre ou reduza a oferta.');
 buyer.coins-=price;const order={id,buyerId:buyer.id,cardId,price,createdAt:now};world.purchaseOrders=[...orders,order];return order;
}
export function cancelOrder(world,buyer,id){const order=(world.purchaseOrders||[]).find(o=>o.id===id);if(!order||order.buyerId!==buyer.id)throw new Error('Encomenda não encontrada.');buyer.coins=(buyer.coins||0)+order.price;world.purchaseOrders=world.purchaseOrders.filter(o=>o.id!==id);return order;}
export function fillOrder(world,seller,buyer,{orderId,itemId},locked=new Set()){
 const order=(world.purchaseOrders||[]).find(o=>o.id===orderId),item=seller.items?.find(i=>i.id===itemId);
 if(!order||order.buyerId!==buyer.id||seller.id===buyer.id)throw new Error('Esta encomenda não pode ser atendida.');
 if(!item||item.cardId!==order.cardId||item.bound||item.listingId||locked.has(item.id)||item.durability<=0||item.durability!==item.maxDurability)throw new Error('Entregue uma peça negociável, livre e totalmente reparada.');
 const tax=Math.floor(order.price*ECONOMY.marketTaxPercent/100),earned=order.price-tax;
 seller.items=seller.items.filter(i=>i.id!==item.id);buyer.items||=[];buyer.items.push({...item,source:'trade-order'});seller.coins=(seller.coins||0)+earned;
 world.purchaseOrders=world.purchaseOrders.filter(o=>o.id!==orderId);
 seller.tradeStats={...seller.tradeStats,deliveries:(seller.tradeStats?.deliveries||0)+1,earned:(seller.tradeStats?.earned||0)+earned};
 return {earned,tax,cardId:item.cardId};
}
