import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureRpg,gainRpg} from '../shared/realm-rpg.js';
import {actionCombat,advanceActionCombat,enemyAttack,cancelActionCombat,combatWorldView,moveWithCollisions} from '../shared/realm-action-combat.js';
import {sweepCircle,sweepCapsule,firstObstacleCollision} from '../shared/realm-collision.js';

const now=1800000000000;
const hit=(_w,target,damage)=>{target.hp=Math.max(0,target.hp-damage);};
const lucky=()=>.8;
function fixture(){
  const p={id:'profile',realm:{publicId:'player',seenAt:now,roaming:{x:30,y:50,hp:100,maxHp:100,energy:100,maxEnergy:100,equipment:[]}},items:[]};ensureRpg(p);
  const enemy={id:'enemy',kind:'hostile',x:34,y:50,hp:100,maxHp:100,attack:10,level:1,attackType:'physical'};
  const w={serial:0,actors:[enemy],slots:[],obstacles:[]};
  return {p,w,s:p.realm.roaming,enemy,cast:(ability,input={},at=now)=>actionCombat(w,p,{ability,...input},[],at,hit,lucky),step:at=>advanceActionCombat(w,[p],[],at,hit,lucky)};
}

test('windup survives serialization and resolves exactly once against actual positions',()=>{
  const f=fixture();f.enemy.x=32;f.cast('strike',{targetId:'enemy'});assert.equal(f.enemy.hp,100);f.step(now+159);assert.equal(f.enemy.hp,100);
  const w=JSON.parse(JSON.stringify(f.w)),p=JSON.parse(JSON.stringify(f.p));advanceActionCombat(w,[p],[],now+160,hit,()=>.999);assert.equal(w.actors[0].hp,87);assert.equal(p.rpg.cast,null);assert.equal(w.combatCasts.length,0);
  advanceActionCombat(w,[p],[],now+500,hit,()=>.999);assert.equal(w.actors[0].hp,87);
  const moved=fixture();moved.enemy.x=32;moved.cast('strike',{targetId:'enemy'});moved.enemy.y+=8;moved.step(now+160);assert.equal(moved.enemy.hp,100);assert.equal(moved.w.combatEvents.at(-1).kind,'miss');
});

test('projectile sweeps the whole tick and hits first body instead of selected distant body',()=>{
  const f=fixture();f.enemy.x=36;const near={...f.enemy,id:'near',x:32};f.w.actors.push(near);f.cast('bolt',{targetId:'enemy'});f.step(now+230);assert.equal(near.hp,100);assert.equal(f.w.projectiles.length,1);
  f.step(now+1000);assert.ok(near.hp<100);assert.equal(f.enemy.hp,100);assert.equal(f.w.projectiles.length,0);
  const impacts=f.w.combatEvents.filter(e=>e.kind==='hit');assert.equal(impacts.length,1);assert.equal(impacts[0].targetId,'near');
});

test('solid obstacle stops projectiles, cuts, walking and dash without tunneling',()=>{
  const f=fixture();f.enemy.x=32.5;f.w.obstacles.push({id:'wall',x:31,y:50,width:.3,height:6});f.cast('bolt',{targetId:'enemy'});f.step(now+1100);assert.equal(f.enemy.hp,100);assert.equal(f.w.projectiles.length,0);assert.equal(f.w.combatEvents.at(-1).kind,'collision');
  f.cast('strike',{targetId:'enemy'},now+1800);f.step(now+2000);assert.equal(f.enemy.hp,100);
  const before=f.s.x;f.cast('dash',{dx:1,dy:0},now+2200);assert.ok(f.s.x>before&&f.s.x<30.7);assert.equal(f.w.combatEvents.at(-1).blocked,true);
  const movement=moveWithCollisions(f.w,{x:30,y:48},{x:34,y:52});assert.ok(movement.blocked);assert.ok(movement.x<31);assert.ok(movement.y>48);
});

test('guard is directional, has finite durability, and overflow breaks it once',()=>{
  const f=fixture();f.enemy.x=31.2;f.cast('guard',{x:35,y:50});const maximum=f.p.rpg.barrier.hp;
  assert.equal(enemyAttack(f.w,f.enemy,f.p,now+100,lucky),0);assert.equal(f.p.rpg.barrier.hp,maximum-10);assert.equal(f.s.hp,100);
  f.enemy.x=28.8;assert.equal(enemyAttack(f.w,f.enemy,f.p,now+200,lucky),10);assert.equal(f.p.rpg.barrier.hp,maximum-10);
  f.enemy.x=31.2;f.enemy.attack=40;const remaining=f.p.rpg.barrier.hp;assert.equal(enemyAttack(f.w,f.enemy,f.p,now+300,lucky),40-remaining);assert.equal(f.p.rpg.barrier,null);assert.ok(f.p.rpg.staggerUntil>now+300);assert.equal(f.w.combatEvents.filter(e=>e.kind==='guard-break').length,1);
});

test('physical counter intercepts a real frontal attack and cancels hostile preparation',()=>{
  const f=fixture();f.enemy.x=31.2;f.enemy.windup={endsAt:now+200};f.cast('parry',{targetId:'enemy'});
  assert.equal(enemyAttack(f.w,f.enemy,f.p,now+300,lucky),0);assert.equal(f.enemy.windup,null);assert.equal(f.enemy.staggerUntil,now+1500);assert.equal(f.p.rpg.barrier,null);assert.ok(f.w.combatEvents.some(e=>e.kind==='parry'));assert.equal(f.s.hp,100);
  const expired=fixture();expired.enemy.x=31.2;expired.cast('parry',{targetId:'enemy'});assert.equal(enemyAttack(expired.w,expired.enemy,expired.p,now+651,lucky),10);
});

test('magic counter reflects actual projectile and damages its original caster',()=>{
  const f=fixture();f.enemy.x=33;f.enemy.attackType='magic';f.cast('reflect',{targetId:'enemy'});enemyAttack(f.w,f.enemy,f.p,now,lucky,{x:30,y:50,damageType:'magic'});
  f.step(now+500);assert.equal(f.s.hp,100);assert.equal(f.w.projectiles.length,1);assert.equal(f.w.projectiles[0].reflected,true);assert.equal(f.w.projectiles[0].source,'player');assert.equal(f.p.rpg.barrier,null);
  f.step(now+1200);assert.equal(f.enemy.hp,90);assert.equal(f.w.projectiles.length,0);assert.equal(f.w.combatEvents.filter(e=>e.kind==='reflect').length,1);
});

test('counter types do not cover each other; magic passes physical parry',()=>{
  const f=fixture();f.enemy.x=32;f.enemy.attackType='magic';f.cast('parry',{targetId:'enemy'});enemyAttack(f.w,f.enemy,f.p,now,lucky);f.step(now+400);assert.equal(f.s.hp,90);assert.ok(!f.w.combatEvents.some(e=>e.kind==='parry'));
  const g=fixture();g.enemy.x=31.2;g.cast('reflect',{targetId:'enemy'});assert.equal(enemyAttack(g.w,g.enemy,g.p,now+100,lucky),10);assert.ok(!g.w.combatEvents.some(e=>e.kind==='reflect'));
});

test('locked enemy strike misses after sidestep; dodge cancels outgoing cast',()=>{
  const f=fixture();f.enemy.x=31;const area={x:30,y:50};f.s.y=52;assert.equal(enemyAttack(f.w,f.enemy,f.p,now,lucky,area),0);assert.equal(f.s.hp,100);
  f.s.y=50;f.cast('bolt',{targetId:'enemy'});f.cast('dash',{dx:0,dy:1},now+80);f.step(now+1000);assert.equal(f.p.rpg.cast,null);assert.equal(f.w.combatCasts.length,0);assert.equal(f.enemy.hp,100);assert.ok(f.w.combatEvents.some(e=>e.kind==='interrupt'));
});

test('damage interrupts windup and rejected defense leaves cast and resources intact',()=>{
  const f=fixture();f.enemy.x=31.2;f.cast('bolt',{targetId:'enemy'});f.s.energy=0;const cast=f.p.rpg.cast.id,mana=f.p.rpg.mana;
  assert.throws(()=>f.cast('parry',{targetId:'enemy'},now+40),/insuficiente/);assert.equal(f.p.rpg.cast.id,cast);assert.equal(f.p.rpg.mana,mana);assert.equal(f.p.rpg.cooldowns.parry,undefined);
  enemyAttack(f.w,f.enemy,f.p,now+100,lucky);assert.equal(f.p.rpg.cast,null);f.step(now+800);assert.equal(f.enemy.hp,100);assert.equal(f.w.projectiles.length,0);
});

test('death, recovery and entering Arena clear ongoing combat without altering Arena data',()=>{
  const f=fixture();f.cast('bolt',{targetId:'enemy'});f.step(now+230);assert.equal(f.w.projectiles.length,1);f.p.realm.activeRoom='arena-1';f.step(now+250);assert.equal(f.w.projectiles.length,0);assert.equal(f.p.realm.activeRoom,'arena-1');
  f.p.realm.activeRoom=null;f.cast('guard',{},now+300);f.p.rpg.evadeUntil=now+1000;cancelActionCombat(f.w,f.p,now+350,'recover');assert.equal(f.p.rpg.barrier,null);assert.equal(f.p.rpg.evadeUntil,0);assert.deepEqual(combatWorldView(f.w,[f.p],now+350).barriers,[]);
});

test('explosion respects cover while affecting enemies on its exposed side',()=>{
  const f=fixture();gainRpg(f.p,700);f.p.rpg.mana=100;f.enemy.x=33;const exposed={...f.enemy,id:'exposed',x:31,y:51};f.w.actors.push(exposed);f.w.obstacles.push({id:'wall',x:32,y:50,width:.3,height:8});f.cast('frost',{x:33,y:50});f.step(now+1300);assert.equal(f.enemy.hp,100);assert.ok(exposed.hp<100);
});

test('collision primitives cover capsule ends, fast crossings and escape from initial overlap',()=>{
  assert.ok(sweepCircle({x:0,y:0},{x:100,y:0},{x:50,y:0},.4));assert.equal(sweepCircle({x:0,y:0},{x:0,y:0},{x:50,y:0},.4),null);
  assert.ok(sweepCapsule({x:0,y:1.1},{x:5,y:1.1},{x:2,y:-1},{x:2,y:1},.2));assert.equal(sweepCapsule({x:0,y:2},{x:5,y:2},{x:2,y:-1},{x:2,y:1},.2),null);
  const w={actors:[{id:'body',kind:'hostile',hp:1,x:30,y:50}],slots:[]};assert.ok(moveWithCollisions(w,{x:30,y:50},{x:31,y:50}).x>30);assert.ok(moveWithCollisions(w,{x:29,y:50},{x:32,y:50}).x<30);assert.equal(firstObstacleCollision(w,{x:1,y:1},{x:2,y:2}),null);
});
