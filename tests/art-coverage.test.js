import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CARDS} from '../shared/cards.js';
import {CARD_ART} from '../shared/art-manifest.js';
test('every collection card has an existing distinct art asset',()=>{
 const hashes=new Set();
 for(const id of Object.keys(CARDS)){
  assert.ok(CARD_ART[id],`Missing art mapping: ${id}`);
  const bytes=readFileSync(new URL('../client'+CARD_ART[id],import.meta.url));
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.ok(!hashes.has(hash),`Duplicate image bytes: ${id}`);hashes.add(hash);
 }
 assert.equal(hashes.size,Object.keys(CARDS).length);
});
