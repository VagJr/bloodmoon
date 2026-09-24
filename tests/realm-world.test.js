import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter} from '../shared/progression.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldAction,advanceRealmWorld,prepareWorldEncounter,settleWorldEncounter} from '../shared/realm-world.js';
const epoch=1800000000000;
function fixture(){const world=createWorld(),p={id:randomUUID(),name:'Vigília',xp:0,level:1,matches:0,wins:0,trophies:[]};grantStarter(p,'vampire',randomUUID);enterRealms(p,randomUUID,epoch);const w=ensureRealmWorld(world,REGIONS,epoch),s=ensureWorldPlayer(p,REGIONS,epoch);p.realm.materials={timber:40,ore:40,essence:40};p.realm.seenAt=epoch;return {world,w,p,s,act:(action,at=epoch)=>realmWorldAction(world,p,action,REGIONS,at),tick:at=>advanceRealmWorld(world,[p],REGIONS,at)};}
test('Recursos renovam no local; produção cobra materiais uma vez e coleta não duplica estoque',()=>{
 const f=fixture(),a=f.w.actors.find(a=>a.kind==='resource'&&a.node==='haven'&&a.resource==='timber');Object.assign(f.s,{x:a.x,y:a.y});
 const material=f.p.realm.materials.timber;f.act({type:'world-interact',targetId:a.id});assert.equal(f.p.realm.materials.timber,material+3);assert.throws(()=>f.act({type:'world-interact',targetId:a.id},epoch+300));
 f.tick(epoch+30500);assert.equal(a.hp,1);assert.equal(a.x,a.homeX);assert.equal(a.y,a.homeY);assert.equal(f.p.realm.adventure.stats.gathers,1);
 const node=REGIONS.find(n=>n.resource==='timber'),slot=f.w.slots.find(s=>s.node===node.id&&s.kind==='resource');Object.assign(f.s,{x:slot.x,y:slot.y});
 const before=f.p.realm.materials.timber;f.act({type:'world-deploy',slotId:slot.id,blueprintId:'lumbermill'},epoch+31000);assert.equal(f.p.realm.materials.timber,before-3);
 assert.throws(()=>f.act({type:'world-deploy',slotId:slot.id,blueprintId:'lumbermill'},epoch+32000));assert.equal(f.p.realm.materials.timber,before-3);
 f.tick(epoch+52000);f.act({type:'world-interact',targetId:slot.id},epoch+52500);assert.equal(slot.occupant.stock,0);assert.equal(f.p.realm.materials.timber,before-2);assert.throws(()=>f.act({type:'world-interact',targetId:slot.id},epoch+53000));
});
test('Relíquias concedem atributos e cada cópia só ocupa um posto ou viajante',()=>{
 const f=fixture();f.act({type:'world-equip',cardId:'ward'});assert.equal(f.s.maxHp,115);assert.equal(f.s.hp,115);assert.throws(()=>f.act({type:'world-equip',cardId:'ward'},epoch+300));
 const slot=f.w.slots.find(s=>s.kind==='weapon');Object.assign(f.s,{x:slot.x,y:slot.y});assert.throws(()=>f.act({type:'world-deploy',slotId:slot.id,cardId:'ward'},epoch+600));assert.equal(slot.occupant,null);
});
test('Raid exige participação, compartilha dano e impede repetir o saque',()=>{
 const f=fixture(),raid=f.w.actors.find(a=>a.kind==='raid');Object.assign(f.s,{x:raid.x,y:raid.y});raid.hp=20;
 f.act({type:'world-attack',targetId:raid.id,cardId:'execution'});assert.equal(raid.hp,0);assert.equal(raid.contributions[f.p.realm.publicId],20);
 const before=f.p.coins;f.act({type:'world-interact',targetId:raid.id},epoch+400);assert.equal(f.p.coins,before+60);assert.throws(()=>f.act({type:'world-interact',targetId:raid.id},epoch+800));assert.equal(f.p.coins,before+60);
 const other=fixture();other.world=f.world;other.w=f.w;Object.assign(other.s,{x:raid.x,y:raid.y});assert.throws(()=>realmWorldAction(f.world,other.p,{type:'world-interact',targetId:raid.id},REGIONS,epoch+1000),/20 de dano/);
});
test('Morte gera risco limitado, retorno respeita espera e espólio só é recuperado uma vez',()=>{
 const f=fixture(),a=f.w.actors.find(a=>a.kind==='hostile'&&a.node!=='haven');Object.assign(f.s,{x:a.x,y:a.y,hp:1});a.attackAt=epoch;const coins=f.p.coins;f.tick(epoch+250);assert.equal(f.s.hp,0);const bag=f.w.actors.find(a=>a.kind==='satchel');assert.ok(bag);assert.ok(coins-f.p.coins<=20);
 assert.throws(()=>f.act({type:'world-recover'},epoch+1000));f.act({type:'world-recover'},epoch+13000);assert.equal(f.s.hp,f.s.maxHp);assert.equal(f.p.realm.location,'haven');Object.assign(f.s,{x:bag.x,y:bag.y});f.act({type:'world-interact',targetId:bag.id},epoch+14000);assert.equal(f.p.coins,coins);assert.throws(()=>f.act({type:'world-interact',targetId:bag.id},epoch+14500));
});
test('Dungeon progride por três mesas e bloqueia nova recompensa após a conclusão',()=>{
 const f=fixture(),portal=f.w.actors.find(a=>a.kind==='portal');Object.assign(f.s,{x:portal.x,y:portal.y});f.p.realm.level=10;f.p.realm.xp=1080;let encounter;
 for(let stage=0;stage<3;stage++){encounter=prepareWorldEncounter(f.world,f.p,{actorId:portal.id},REGIONS,epoch+stage*1000);assert.equal(encounter.stage,stage);settleWorldEncounter(f.world,f.p,encounter,true,false,REGIONS,epoch+stage*1000,['court']);}
 assert.equal(f.p.realm.expedition,null);assert.equal(f.p.realm.adventure.stats.dungeons,1);assert.equal(f.p.realm.adventure.stats.fronts.court,3);const coins=f.p.coins;settleWorldEncounter(f.world,f.p,encounter,true,false,REGIONS,epoch+4000);assert.equal(f.p.coins,coins);assert.throws(()=>prepareWorldEncounter(f.world,f.p,{actorId:portal.id},REGIONS,epoch+4000));
});
test('Cache clona antes de entregar a resposta consumida pelo navegador',async()=>{
 const code=await readFile(new URL('../client/service-worker.js',import.meta.url),'utf8'),handlers={},work=[],saved=[];
 const cache={put:async(req,res)=>saved.push(await res.text())};
 const context=vm.createContext({URL,Response,self:{location:{origin:'https://game.test'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:()=>new Promise(resolve=>setImmediate(()=>resolve(cache))),match:async()=>undefined},fetch:async()=>new Response('reinos funcionando')});
 vm.runInContext(code,context);let response;
 handlers.fetch({request:{method:'GET',url:'https://game.test/realm-world.css',mode:'cors'},waitUntil:p=>work.push(p),respondWith:p=>{response=p;}});
 assert.equal(await (await response).text(),'reinos funcionando');await Promise.all(work);assert.deepEqual(saved,['reinos funcionando']);
});
