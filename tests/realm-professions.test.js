import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureProfession,professionAction,advanceProfessions,professionView} from '../shared/realm-professions.js';
import {ensureLore,recordLore,loreAction,loreView,VESPERA_CHRONICLE} from '../shared/realm-lore.js';

const now=1800000000000;
function fixture(faction){
 const city={node:'haven',x:10,y:10,hp:500,maxHp:600,morale:50,resource:'timber',stock:{timber:0,ore:0,essence:0}};
 const world={houses:[{id:'house',name:'Casa da Lua',treasury:0,settlement:city}]};
 const player={name:'Viajante',starterFaction:faction,coins:0,realm:{publicId:'player',houseId:'house',materials:{timber:3,ore:0,essence:4},lineage:{blood:30},roaming:{x:12,y:10}}};
 const corpse={id:'fallen',kind:'hostile',name:'Errante',cardId:'thrall',hp:0,respawnAt:now+45000,lastHitBy:'player',x:12,y:10,level:4};
 const merchant={id:'market',kind:'merchant',hp:1,x:12,y:10};
 const w={serial:0,actors:[corpse,merchant]};return {world,player,w,city,corpse,merchant};
}
test('vampire servants cost blood and essence, obey tasks, and produce for a living city',()=>{
 const {world,player,w,city,corpse}=fixture('vampire');
 ensureProfession(player);const result=professionAction(world,w,player,{operation:'convert',targetId:corpse.id},now);
 assert.match(result.message,/Servo/);assert.equal(player.realm.lineage.blood,18);assert.equal(player.realm.materials.essence,2);
 assert.equal(player.realm.profession.servants.length,1);assert.equal(w.actors.find(a=>a.kind==='servant').owner,'player');
 assert.throws(()=>professionAction(world,w,player,{operation:'convert',targetId:corpse.id},now+100),/destino/);
 advanceProfessions(world,w,[player],now+31000);assert.ok(city.stock.timber>0);
 const servantId=player.realm.profession.servants[0].id;
 professionAction(world,w,player,{operation:'command',servantId,task:'guard'},now+32000);
 city.hp=450;advanceProfessions(world,w,[player],now+63000);assert.ok(city.hp>450);
 professionAction(world,w,player,{operation:'command',servantId,task:'trade'},now+64000);
 advanceProfessions(world,w,[player],now+95000);assert.ok(world.houses[0].treasury>0);
 assert.equal(professionView(world,player).servants.length,1);
 professionAction(world,w,player,{operation:'release',servantId},now+96000);assert.equal(player.realm.profession.servants.length,0);
});
test('werewolf hunter prepares each prey once, sells spoils, and preserves meat for city provisions',()=>{
 const {world,player,w,city,corpse,merchant}=fixture('werewolf');ensureProfession(player);
 professionAction(world,w,player,{operation:'dress',targetId:corpse.id},now);assert.ok(player.realm.profession.meat>0);
 assert.throws(()=>professionAction(world,w,player,{operation:'dress',targetId:corpse.id},now+100),/já foi preparada/);
 player.realm.profession.meat=10;const before=player.coins;
 professionAction(world,w,player,{operation:'sell',targetId:merchant.id},now+200);assert.ok(player.coins>before);
 professionAction(world,w,player,{operation:'preserve'},now+300);assert.ok(city.stock.provisions>=7);
 assert.equal(player.realm.profession.meat,0);
});
test('chronicle unlocks from gameplay, cannot read sealed pages, and transmits only progress IDs',()=>{
 const {player}=fixture('vampire');ensureLore(player);assert.equal(VESPERA_CHRONICLE.length,12);
 assert.throws(()=>loreAction(player,{entryId:'veil'}),/descoberta/);
 recordLore(player,'ash');loreAction(player,{entryId:'ash'});assert.ok(loreView(player).read.includes('ash'));
 assert.equal('entries' in loreView(player),false);
 for(const id of ['roots','hunt','houses','bloodcraft','mooncraft','sigils','veil'])recordLore(player,id);
 assert.ok(loreView(player).unlocked.includes('tomorrow'));
});
