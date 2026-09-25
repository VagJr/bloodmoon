import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorldDelta,applyRealmWorldDelta,realmCombatDelta} from '../shared/realm-delta.js';

test('realm stream preserves the complete world through updates, spawns and removals',()=>{
  const previous={version:1,serverTime:10,rules:{speed:3},blueprints:{camp:{}},slotKinds:{},continents:[],cards:[],cityBuildings:{},ecology:{season:'fog'},plots:[{id:'land'}],settlements:[],events:[],invasions:[],actors:[{id:'a',x:1,hp:10,windup:null},{id:'b',x:2,hp:5}],slots:[{id:'s',occupant:{hp:10}}],players:[{id:'p',x:1}],player:{id:'p',moveSeq:1}};
  const current={...previous,version:2,serverTime:20,actors:[{id:'a',x:2,hp:8,windup:{endsAt:30}},{id:'c',x:3,hp:15}],slots:[{id:'s',occupant:null}],players:[{id:'p',x:2}],player:{id:'p',moveSeq:2}};
  const delta=realmWorldDelta(current,previous);
  assert.deepEqual(applyRealmWorldDelta(previous,delta),current);
  assert.deepEqual(delta.actors[0],{id:'a',x:2,hp:8,windup:{endsAt:30}});
  assert.deepEqual(delta.removed.actors,['b']);
  assert.equal(delta.rules,undefined);
});

test('combat response updates nearby state without replacing the rest of the map',()=>{
  const previous={serverTime:10,player:{x:10,y:10},rules:{speed:3},actors:[{id:'near',x:12,y:10,hp:10},{id:'far',x:90,y:10,hp:20}],slots:[{id:'near-slot',x:11,y:10,occupant:null},{id:'far-slot',x:80,y:10,occupant:null}],players:[],combat:{projectiles:[]}};
  const current={...previous,serverTime:20,actors:[{id:'near',x:12,y:10,hp:4},{id:'far',x:90,y:10,hp:18}],slots:[{id:'near-slot',x:11,y:10,occupant:{hp:5}},{id:'far-slot',x:80,y:10,occupant:null}],combat:{projectiles:[{id:'shot'}]}};
  const patch=realmCombatDelta(current);
  const merged=applyRealmWorldDelta(previous,patch);
  assert.equal(merged.actors.find(actor=>actor.id==='near').hp,4);
  assert.equal(merged.actors.find(actor=>actor.id==='far').hp,20);
  assert.deepEqual(merged.slots.find(slot=>slot.id==='near-slot').occupant,{hp:5});
  assert.deepEqual(merged.combat,current.combat);
  assert.deepEqual(merged.rules,previous.rules);
});
