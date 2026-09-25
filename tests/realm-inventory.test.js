import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter,makeItem} from '../shared/progression.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldAction,realmWorldView} from '../shared/realm-world.js';
import {wearRealmGear,dropEquippedGear} from '../shared/realm-loot.js';
const epoch=1800000000000;
function fixture(){
 const world=createWorld(),p={id:randomUUID(),name:'Inventário',xp:0,level:1,matches:0,wins:0,trophies:[]};
 grantStarter(p,'vampire',randomUUID);enterRealms(p,randomUUID,epoch);ensureRealmWorld(world,REGIONS,epoch);const s=ensureWorldPlayer(p,REGIONS,epoch);let at=epoch;
 return {p,s,world,act:input=>realmWorldAction(world,p,input,REGIONS,at+=1000),view:()=>realmWorldView(world,p,[p],REGIONS,at)};
}
test('anatomical slots replace only the same category, preserve inventory, and allow removal',()=>{
 const f=fixture();for(const id of ['blackcrown','ivorychain','relic','bloodshard'])f.p.items.push(makeItem(id,randomUUID));
 for(const cardId of ['ward','blade','blackcrown','relic','bloodshard'])f.act({type:'world-equip',cardId});
 assert.equal(f.s.equipment.length,5);const count=f.p.items.length;
 f.act({type:'world-equip',cardId:'ivorychain'});assert.equal(f.s.equipment.length,5);assert.ok(!f.s.equipment.includes('ward'));assert.ok(f.s.equipment.includes('blade'));assert.equal(f.p.items.length,count);
 f.act({type:'world-unequip',cardId:'ivorychain'});assert.ok(!f.s.equipment.includes('ivorychain'));assert.equal(f.p.items.length,count);
 assert.throws(()=>f.act({type:'world-unequip',cardId:'ivorychain'}),/não está equipado/);
});
test('selected gear instance alone is marked, worn and dropped; bound copies stay',t=>{
 t.mock.method(Math,'random',()=>.8);
 const f=fixture(),copy=makeItem('blade',randomUUID);copy.bound=false;f.p.items.push(copy);
 const original=f.p.items.find(i=>i.cardId==='blade'),durability=original.durability;
 f.act({type:'world-equip',cardId:'blade',itemId:copy.id});
 assert.deepEqual(f.view().inventory.filter(i=>i.equipped).map(i=>i.id),[copy.id]);
 assert.equal(wearRealmGear(f.p,epoch+30000).itemId,copy.id);assert.equal(original.durability,durability);
 assert.deepEqual(dropEquippedGear(f.p).map(i=>i.id),[copy.id]);assert.ok(f.p.items.includes(original));
 f.act({type:'world-equip',cardId:'blade',itemId:original.id});assert.deepEqual(dropEquippedGear(f.p),[]);
});
test('inventory includes collection stacks and rejects unavailable instances without spending vigor',()=>{
 const f=fixture(),item=makeItem('blackcrown',randomUUID);item.lockedBy='arena';f.p.items.push(item);
 const energy=f.s.energy;assert.throws(()=>f.act({type:'world-equip',cardId:'blackcrown',itemId:item.id}));assert.equal(f.s.energy,energy);
 const cards=f.view().inventory.filter(i=>i.id.startsWith('card:'));assert.ok(cards.length>0);for(const i of cards)assert.equal(i.quantity,f.p.collection[i.cardId]);
});
test('legacy duplicate body slots migrate without losing the unequipped item',()=>{
 const f=fixture();f.p.items.push(makeItem('ivorychain',randomUUID));f.s.equipment=['ward','ivorychain'];delete f.s.equipmentSchema;
 ensureWorldPlayer(f.p,REGIONS,epoch+1000);assert.deepEqual(f.s.equipment,['ivorychain']);assert.ok(f.p.items.some(i=>i.cardId==='ward'));
});
