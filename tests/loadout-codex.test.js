import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS} from '../shared/cards.js';
import {CODEX,cardTerms} from '../shared/codex.js';
import {grantStarter,makeItem,reconcileDepletedGear} from '../shared/progression.js';
import {loadoutStatus,reserveSlots,suggestLoadout} from '../shared/loadout.js';
const fixture=()=>{const p={};grantStarter(p);return p;};
test('codex covers all printed effects without repeating seals',()=>{
 for(const c of Object.values(CARDS)){
  for(const key of [c.effect,c.keyword,c.gearEffect].filter(Boolean))assert.ok(CODEX[key],`${c.id}: ${key}`);
  const terms=cardTerms(c);assert.equal(new Set(terms).size,terms.length);
 }
});
test('quick preparation replaces depleted gear without spending or mutating its preview',()=>{
 const p=fixture(),d=p.decks[0];p.items.forEach(i=>i.durability=0);const before=structuredClone(p),plan=suggestLoadout(p,d);
 assert.ok(plan.ready);assert.ok(plan.changes.length);assert.deepEqual(p,before);
 assert.ok(loadoutStatus(p,{...d,cards:plan.cards,autoRefills:plan.autoRefills}).ready);
 assert.equal(plan.cards.length,20);assert.ok(plan.cards.every(id=>CARDS[id].type!=='equipment'));
});
test('reserves map to unique positions and available original gear is restored',()=>{
 const p=fixture(),d=p.decks[0];p.items.forEach(i=>i.durability=0);reconcileDepletedGear(p);
 assert.equal(reserveSlots(d).size,d.autoRefills.length);
 const id=d.autoRefills[0].equipmentId;p.items.push(makeItem(id));
 const plan=suggestLoadout(p,d);assert.ok(plan.ready);assert.ok(plan.cards.includes(id));
});
test('quick preparation excludes advertised and locked gear, respects copies, and detects other deck defects',()=>{
 const p=fixture(),d=p.decks[0];p.items.forEach(i=>i.durability=0);reconcileDepletedGear(p);
 const id=d.autoRefills[0].equipmentId;p.items.push({...makeItem(id),listingId:'listing'},{...makeItem(id),locked:true});
 assert.ok(!suggestLoadout(p,d).cards.includes(id));
 p.items.push(makeItem(id));const plan=suggestLoadout(p,d);assert.equal(plan.cards.filter(c=>c===id).length,1);
 const invalid={...d,cards:d.cards.slice(1)};assert.equal(suggestLoadout(p,invalid).ready,false);
});
