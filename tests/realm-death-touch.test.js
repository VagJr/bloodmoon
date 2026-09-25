import test from 'node:test';
import assert from 'node:assert/strict';
import {deathStyle,deathEvent,shouldAnimateDeath} from '../client/realm-token-death.js';
import {touchSpan,pinchCamera} from '../client/realm-touch-camera.js';

test('death only animates a confirmed alive to dead transition, not initial corpses or repeated snapshots',()=>{
 assert.equal(shouldAnimateDeath(true,0),true);assert.equal(shouldAnimateDeath(true,-1),true);
 assert.equal(shouldAnimateDeath(undefined,0),false);assert.equal(shouldAnimateDeath(false,0),false);assert.equal(shouldAnimateDeath(true,10),false);
});
test('lethal spell chooses explosion even if generic kill record says strike',()=>{
 const world={serverTime:1500,combatEvents:[{targetId:'enemy',kind:'hit',ability:'bolt',at:1450},{targetId:'enemy',kind:'kill',ability:'strike',at:1451}]};
 assert.equal(deathStyle(deathEvent(world,'enemy')),'burst');
 assert.equal(deathStyle({ability:'cleave'}),'split');assert.equal(deathStyle({ability:'rend'}),'shred');
 assert.deepEqual(deathEvent({...world,serverTime:8000},'enemy'),{});
});
test('pinch zoom and translation keep the same world point under the moving midpoint',()=>{
 const start={camera:{x:-300,y:-500,z:.5},span:touchSpan([{x:100,y:200},{x:200,y:200}])};
 const span=touchSpan([{x:80,y:250},{x:280,y:250}]),next=pinchCamera(start,span);
 assert.equal(next.z,1);assert.equal((span.x-next.x)/next.z,(start.span.x-start.camera.x)/start.camera.z);
 assert.equal((span.y-next.y)/next.z,(start.span.y-start.camera.y)/start.camera.z);
 const limited=pinchCamera(start,{x:150,y:200,distance:1000});assert.equal(limited.z,1.05);
 assert.equal(pinchCamera(start,{x:150,y:200,distance:1}).z,.09);
});
