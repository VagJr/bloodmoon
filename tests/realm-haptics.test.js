import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealmHaptics} from '../client/realm-haptics.js';

function fixture(){
  let now=2000;const pulses=[],saved=new Map(),listeners=new Map();
  const doc={hidden:false,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  const nav={vibrate:value=>{pulses.push(value);return true;},userActivation:{hasBeenActive:true}};
  const h=createRealmHaptics({navigator:nav,document:doc,clock:()=>now,storage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}});
  const event=(kind,id=kind,extra={})=>h.trigger({kind,id,at:now,source:'traveler',...extra},{playerId:'traveler',now});
  return {h,event,pulses,saved,doc,nav,listeners,advance:ms=>now+=ms};
}

test('Haptics require interaction, ignore other players, stale events and replayed snapshots',()=>{
  const f=fixture();assert.equal(f.event('hit'),false);f.h.prime();
  assert.equal(f.event('hit','foreign',{source:'someone-else'}),false);
  assert.equal(f.event('hit','old',{at:1}),false);
  assert.equal(f.event('hit'),true);f.advance(400);assert.equal(f.event('hit'),false);
  assert.equal(f.pulses.length,1);
});

test('Strong counters interrupt light hits; continuous attacks do not erase defensive patterns',()=>{
  const f=fixture();f.h.prime();f.h.setMode('full');
  assert.equal(f.event('hit'),true);f.advance(80);assert.equal(f.event('parry'),true);
  f.advance(80);assert.equal(f.event('hit','hit-2'),false);
  f.advance(300);assert.equal(f.event('reflect'),true);
  assert.notDeepEqual(f.pulses[1],f.pulses[2]);
  f.advance(400);assert.equal(f.event('guard-break'),true);
  assert.ok(f.pulses.at(-1).reduce((a,b)=>a+b,0)<250);
});

test('Tactile preferences persist, scale pulses and stop immediately when disabled or hidden',()=>{
  const f=fixture();f.h.prime();assert.equal(f.h.getMode(),'soft');f.event('enemy-hit');const soft=f.pulses.at(-1);
  f.advance(500);f.h.setMode('full');f.event('enemy-hit','hurt-2');assert.ok(f.pulses.at(-1)[0]>soft[0]);
  f.doc.hidden=true;f.listeners.get('visibilitychange')();assert.equal(f.pulses.at(-1),0);
  f.advance(500);assert.equal(f.event('critical'),false);f.doc.hidden=false;
  f.h.setMode('off');assert.equal(f.event('critical','critical-2'),false);assert.ok([...f.saved.values()].includes('off'));
  f.h.cancel();assert.equal(f.listeners.size,0);
});

test('Unsupported or blocked vibration hardware never breaks combat',()=>{
  const unsupported=createRealmHaptics({navigator:{}});assert.equal(unsupported.prime(),false);
  const f=fixture();f.h.prime();f.nav.vibrate=()=>{throw new Error('blocked');};assert.equal(f.event('parry'),false);assert.doesNotThrow(()=>f.h.cancel());
});
