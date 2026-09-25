import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleRealmMotion,advanceRealmMotion} from '../shared/realm-motion.js';

test('remote actors continue smoothly between authoritative snapshots and settle after stopping',()=>{
  let motion=sampleRealmMotion(null,{x:10,y:10},1000,0);
  motion=sampleRealmMotion(motion,{x:11,y:10},1500,500);
  const positions=[];
  for(let now=516;now<=980;now+=16)positions.push(advanceRealmMotion(motion,now,16).x);
  assert.ok(positions.every((x,index)=>index===0||x>=positions[index-1]));
  assert.ok(positions.at(-1)>11.4,'O ator continua andando antes da próxima atualização.');
  const beforeCorrection=motion.x;
  sampleRealmMotion(motion,{x:11.5,y:10},2000,1000);
  assert.equal(motion.x,beforeCorrection,'A correção do servidor não causa salto visível.');
  sampleRealmMotion(motion,{x:11.5,y:10},2500,1500);
  for(let now=1516;now<=1900;now+=16)advanceRealmMotion(motion,now,16);
  assert.ok(Math.abs(motion.x-11.5)<.02,'O ator para na posição confirmada.');
});

test('teleport and extreme network gaps snap to the authoritative location',()=>{
  const motion=sampleRealmMotion(null,{x:5,y:5},1000,0);
  sampleRealmMotion(motion,{x:40,y:40},1500,500);
  assert.deepEqual([motion.x,motion.y,motion.vx,motion.vy],[40,40,0,0]);
  sampleRealmMotion(motion,{x:42,y:40},6000,5000);
  assert.deepEqual([motion.x,motion.y],[42,40]);
});

test('visual prediction stays near the server position during a delayed update',()=>{
  const motion=sampleRealmMotion(null,{x:5,y:5},1000,0);
  sampleRealmMotion(motion,{x:6,y:5},1250,250);
  for(let now=266;now<=2250;now+=16)advanceRealmMotion(motion,now,16);
  assert.ok(Math.hypot((motion.x-motion.anchorX)*1.5,motion.y-motion.anchorY)<=2.51);
});
