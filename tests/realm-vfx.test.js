import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {abilityIcon,drawVfx,drawCombatEntities,primeVfx,vfxDuration,warmVfx} from '../client/realm-vfx.js';

const manifest=JSON.parse(await readFile(new URL('../client/assets/world/vfx/frames/manifest.json',import.meta.url),'utf8'));
function canvas(){
 const calls=[],gradient={addColorStop(){}};
 const ctx={calls,canvas:{clientWidth:1200,clientHeight:800},createRadialGradient:()=>gradient,createLinearGradient:()=>gradient};
 for(const method of ['save','restore','translate','rotate','drawImage','beginPath','closePath','moveTo','lineTo','arc','ellipse','fill','stroke','setLineDash'])ctx[method]=(...args)=>calls.push({method,args});
 return ctx;
}
const point={x:360,y:240},origin={x:40,y:90};
const project=p=>({x:p.x*60,y:p.y*40});

test('compact atlases decode once; individual sprites stay within their source cells',async t=>{
 const images=[];
 class ImageMock{
  constructor(){images.push(this);}
  set src(value){this.url=value;const name=value.split('/').at(-1).replace('.webp','');this.naturalHeight=209;this.naturalWidth=manifest[name].cells.length*209;queueMicrotask(()=>this.onload());}
  async decode(){this.decodes=(this.decodes||0)+1;}
 }
 const previous=Object.getOwnPropertyDescriptor(globalThis,'Image');
 Object.defineProperty(globalThis,'Image',{value:ImageMock,configurable:true,writable:true});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'Image',previous);else delete globalThis.Image;});
 await warmVfx({abilities:[{id:'frost',unlocked:true},{id:'bolt',unlocked:true}]});
 const first=images.length;
 await warmVfx({abilities:[{id:'frost',unlocked:true},{id:'bolt',unlocked:true}]});
 await primeVfx({kind:'critical',ability:'strike'});
 assert.equal(images.length,first);
 assert.ok(images.every(image=>image.decodes===1));
 for(const event of [{kind:'critical',ability:'strike'},{kind:'reflect',ability:'reflect'},{kind:'guard',ability:'guard'},{kind:'hit',ability:'frost'}]){
  const ctx=canvas();drawVfx(ctx,{...event,started:0},100,point,origin,.6);
  const draws=ctx.calls.filter(call=>call.method==='drawImage');assert.ok(draws.length>0);
  for(const {args:[image,x,y,width,height]} of draws){
   assert.equal(width,height);assert.ok(width<image.naturalHeight);
   assert.ok(x>=0&&y>=0&&x+width<=image.naturalWidth&&y+height<=image.naturalHeight);
  }
 }
});

test('an impact is anchored at collision, never replayed as a projectile from its caster',()=>{
 const ctx=canvas(),event={kind:'hit',ability:'bolt',started:0};
 drawVfx(ctx,event,90,point,origin);
 const images=ctx.calls.filter(call=>call.method==='translate');
 assert.ok(images.length>0);assert.ok(images.every(call=>call.args[0]===point.x));
 const expired=canvas();assert.equal(drawVfx(expired,event,vfxDuration(event)+1,point,origin),true);
 assert.equal(expired.calls.length,0,'expired VFX must not freeze or trigger a legacy fallback');
});

test('launch feedback stays at the caster while projectile travel is owned by live entities',()=>{
 const ctx=canvas();drawVfx(ctx,{kind:'launch',ability:'bolt',started:0},50,point,origin);
 const arcs=ctx.calls.filter(call=>call.method==='arc'||call.method==='ellipse');
 assert.ok(arcs.length>0);assert.ok(arcs.every(call=>call.args[0]===origin.x));
});

test('projectiles have bounded interpolation, respect expiry and leave the server snapshot intact',t=>{
 t.mock.method(Date,'now',()=>1250);
 const shot={id:'p1',ability:'bolt',damageType:'magic',x:1,y:2,velocityX:10,velocityY:0,radius:.2,expiresAt:3000};
 const world={serverTime:1000,_receivedAt:1000,combat:{projectiles:[shot]}},before=structuredClone(world),ctx=canvas();
 drawCombatEntities(ctx,world,1000,project,1);
 assert.deepEqual(world,before);
 const cores=ctx.calls.filter(call=>call.method==='arc');assert.ok(cores.length>0);
 assert.ok(cores.some(call=>call.args[0]===120&&call.args[1]===58),'only 100 ms of forward prediction is allowed');
 const expired=canvas();world.combat.projectiles[0].expiresAt=1100;drawCombatEntities(expired,world,1000,project);
 assert.equal(expired.calls.length,0);
});

test('shield membrane follows authoritative capsule endpoints and the locally rendered player pose',t=>{
 t.mock.method(Date,'now',()=>1000);
 const world={serverTime:1000,_receivedAt:1000,player:{publicId:'me',x:1,y:2},combat:{barriers:[{id:'b',source:'me',kind:'guard',x:1,y:2,startX:1.48,startY:.85,endX:1.48,endY:3.15,thickness:.13,facingX:1,facingY:0,radius:1.15,hp:20,maxHp:30,expiresAt:3000,perfectUntil:1200}]}};
 const ctx=canvas();drawCombatEntities(ctx,world,500,project,1,{x:2,y:2});
 const starts=ctx.calls.filter(call=>call.method==='moveTo');
 assert.ok(starts.some(call=>Math.abs(call.args[0]-148.8)<1e-8&&Math.abs(call.args[1]-34)<1e-8));
 const ends=ctx.calls.filter(call=>call.method==='lineTo');
 assert.ok(ends.some(call=>Math.abs(call.args[0]-148.8)<1e-8&&Math.abs(call.args[1]-126)<1e-8));
 for(const call of ctx.calls)for(const arg of call.args)if(typeof arg==='number')assert.ok(Number.isFinite(arg));
});

test('new defensive abilities reuse available icon assets',()=>{
 assert.equal(abilityIcon('parry'),'/assets/world/ability-icons/cleave.webp');
 assert.equal(abilityIcon('reflect'),'/assets/world/ability-icons/frost.webp');
});
