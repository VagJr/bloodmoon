import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter} from '../shared/progression.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldAction,realmWorldView} from '../shared/realm-world.js';

const now=1800000000000;
function traveler(world,faction,name){const p={id:randomUUID(),name,xp:0,level:1,matches:0,wins:0,trophies:[]};grantStarter(p,faction,randomUUID);enterRealms(p,randomUUID,now);ensureWorldPlayer(p,REGIONS,now);p.realm.seenAt=now;return p;}
test('dungeon interior is shared, gated by sigils, and treasure is claimed once per player',()=>{
 const world=createWorld(),p=traveler(world,'vampire','Aria'),q=traveler(world,'werewolf','Lobo'),w=ensureRealmWorld(world,REGIONS,now),portal=w.actors.find(a=>a.node==='icecrypt'&&a.kind==='portal');
 assert.ok(portal);for(const player of [p,q]){Object.assign(player.realm.roaming,{x:portal.x,y:portal.y});realmWorldAction(world,player,{type:'world-dungeon-enter',targetId:portal.id},REGIONS,now,[p,q]);}
 const dungeon=w.dungeons[portal.node];assert.equal(dungeon.theme,'moon');assert.equal(realmWorldView(world,p,[p,q],REGIONS,now).dungeon.players.length,2);
 assert.throws(()=>realmWorldAction(world,p,{type:'world-dungeon-attack',targetId:dungeon.enemies.at(-1).id},REGIONS,now+100,[p,q]),/alcance|selos/);
 dungeon.enemies[0].hp=0;dungeon.enemies[1].hp=0;
 p.realm.roaming.dungeon.x=42;p.realm.roaming.dungeon.y=61;
 realmWorldAction(world,p,{type:'world-dungeon-interact',targetId:'west'},REGIONS,now+300,[p,q]);
 assert.throws(()=>realmWorldAction(world,q,{type:'world-dungeon-interact',targetId:'west'},REGIONS,now+400,[p,q]));
 p.realm.roaming.dungeon.x=66;p.realm.roaming.dungeon.y=59;
 realmWorldAction(world,p,{type:'world-dungeon-interact',targetId:'east'},REGIONS,now+500,[p,q]);assert.equal(dungeon.sigils.every(s=>s.active),true);
 dungeon.enemies.at(-1).hp=0;p.realm.roaming.dungeon.x=88;p.realm.roaming.dungeon.y=54;
 const before=p.coins;realmWorldAction(world,p,{type:'world-dungeon-interact',targetId:'sanctum'},REGIONS,now+700,[p,q]);assert.ok(p.coins>before);
 assert.throws(()=>realmWorldAction(world,p,{type:'world-dungeon-interact',targetId:'sanctum'},REGIONS,now+800,[p,q]));
 realmWorldAction(world,p,{type:'world-dungeon-exit'},REGIONS,now+900,[p,q]);assert.equal(p.realm.roaming.dungeon,null);
});
test('lineage resources require an eligible corpse, cannot be claimed twice, and trade at a merchant',()=>{
 const world=createWorld(),p=traveler(world,'vampire','Dama'),w=ensureRealmWorld(world,REGIONS,now),corpse=w.actors.find(a=>a.kind==='hostile'),merchant=w.actors.find(a=>a.kind==='merchant');
 Object.assign(corpse,{hp:0,respawnAt:now+45000,lastHitBy:p.realm.publicId});Object.assign(p.realm.roaming,{x:corpse.x,y:corpse.y});
 realmWorldAction(world,p,{type:'world-lineage',operation:'drain',targetId:corpse.id},REGIONS,now,[p]);assert.ok(p.realm.lineage.blood>0);
 assert.throws(()=>realmWorldAction(world,p,{type:'world-lineage',operation:'drain',targetId:corpse.id},REGIONS,now+300,[p]));
 Object.assign(p.realm.roaming,{x:merchant.x,y:merchant.y});const blood=p.realm.lineage.blood;
 realmWorldAction(world,p,{type:'world-lineage',operation:'sell',targetId:merchant.id,amount:1},REGIONS,now+600,[p]);assert.equal(p.realm.lineage.blood,blood-1);
});
