import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenAuraGeometry,travelerAuraState,drawCombatEntities} from '../client/realm-vfx.js';

test('token measurements use map zoom independently of enlarged combat effects',()=>{
 const g=tokenAuraGeometry({x:300,y:200},.6);
 assert.equal(g.width,36);assert.equal(g.height,46.8);assert.equal(g.top,149.24);
 const calls=[];const ctx={canvas:{clientWidth:1000,clientHeight:1000},createRadialGradient:()=>({addColorStop(){}})};
 for(const method of ['save','restore','beginPath','rect','roundRect','clip','ellipse','stroke','arc','fill'])ctx[method]=(...args)=>calls.push([method,...args]);
 drawCombatEntities(ctx,{serverTime:1000,_receivedAt:Date.now(),player:{publicId:'geometry',hp:10,x:1,y:1},karma:{rankTier:0,faction:'vampire'},combat:{}},0,()=>({x:300,y:200}),.96,null,.6);
 const cutout=calls.find(c=>c[0]==='roundRect');assert.equal(cutout[3],38.4);
 assert.ok(calls.some(c=>c[0]==='clip'&&c[1]==='evenodd'));
});
test('combos, boss surges and healing expire with server time',()=>{
 const position={publicId:'states'},world={player:position,rpg:{level:1},combat:{},combatEvents:[{source:'states',kind:'heal',at:1000}]};
 const karma={comboTier:4,comboEndsAt:2000,lastBossKillAt:1000,lastKillAt:1000};
 const active=travelerAuraState(world,position,karma,1500,0);
 assert.equal(active.combo,4);assert.ok(active.boss>0);assert.equal(active.heal,true);
 const expired=travelerAuraState(world,position,karma,8000,7000);
 assert.equal(expired.combo,0);assert.equal(expired.boss,0);assert.equal(expired.heal,false);
});
test('level celebration triggers on an increase, never merely opening a high-level character',()=>{
 const position={publicId:'level-transition'},world={player:position,rpg:{level:10},combat:{}};
 assert.equal(travelerAuraState(world,position,{},1000,1000).levelUp,0);
 world.rpg.level=11;assert.equal(travelerAuraState(world,position,{},1100,1100).levelUp,1);
 assert.equal(travelerAuraState(world,position,{},5000,5000).levelUp,0);
});
