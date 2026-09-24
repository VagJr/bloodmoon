import test from 'node:test';
import assert from 'node:assert/strict';
import {FEATURES,featureOpen,journeyAct,lessonFeature,JOURNEY_LESSONS} from '../shared/player-journey.js';
test('new journey unlocks each feature only at its milestone, veterans retain access',()=>{
 for(const [id,f] of Object.entries(FEATURES)){
  assert.equal(featureOpen({matches:0},id),true);
  if(f.at)assert.equal(featureOpen({journey:{version:1},matches:f.at-1},id),false);
  assert.equal(featureOpen({journey:{version:1},matches:f.at},id),true);
 }
});
test('journey reaches a defined campaign ending and lessons have valid feature dependencies',()=>{
 assert.equal(journeyAct({matches:0}).id,0);assert.equal(journeyAct({matches:2}).id,1);
 assert.equal(journeyAct({matches:6}).id,2);assert.equal(journeyAct({realm:{adventure:{chapter:8}}}).id,3);
 for(const [id,l] of Object.entries(JOURNEY_LESSONS)){assert.ok(l.steps.length>=2);assert.ok(!lessonFeature(id)||FEATURES[lessonFeature(id)]);}
});
