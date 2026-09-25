import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorldDelta,applyRealmWorldDelta} from '../shared/realm-delta.js';

test('realm stream preserves the complete world through updates, spawns and removals',()=>{
  const previous={version:1,serverTime:10,rules:{speed:3},blueprints:{camp:{}},slotKinds:{},continents:[],cards:[],cityBuildings:{},ecology:{season:'fog'},plots:[{id:'land'}],settlements:[],events:[],invasions:[],actors:[{id:'a',x:1,hp:10,windup:null},{id:'b',x:2,hp:5}],slots:[{id:'s',occupant:{hp:10}}],players:[{id:'p',x:1}],player:{id:'p',moveSeq:1}};
  const current={...previous,version:2,serverTime:20,actors:[{id:'a',x:2,hp:8,windup:{endsAt:30}},{id:'c',x:3,hp:15}],slots:[{id:'s',occupant:null}],players:[{id:'p',x:2}],player:{id:'p',moveSeq:2}};
  const delta=realmWorldDelta(current,previous);
  assert.deepEqual(applyRealmWorldDelta(previous,delta),current);
  assert.deepEqual(delta.actors[0],{id:'a',x:2,hp:8,windup:{endsAt:30}});
  assert.deepEqual(delta.removed.actors,['b']);
  assert.equal(delta.rules,undefined);
});
