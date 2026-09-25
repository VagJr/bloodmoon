import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter} from '../shared/progression.js';
import {WORLD_RULES,ensureRealmWorld,ensureWorldPlayer,realmWorldAction,advanceRealmWorld,prepareWorldEncounter,settleWorldEncounter,grantArenaAfterglow} from '../shared/realm-world.js';
const epoch=1800000000000;
function fixture(){const world=createWorld(),p={id:randomUUID(),name:'Vigília',xp:0,level:1,matches:0,wins:0,trophies:[]};grantStarter(p,'vampire',randomUUID);enterRealms(p,randomUUID,epoch);const w=ensureRealmWorld(world,REGIONS,epoch),s=ensureWorldPlayer(p,REGIONS,epoch);p.realm.materials={timber:40,ore:40,essence:40};p.realm.seenAt=epoch;return {world,w,p,s,act:(action,at=epoch)=>realmWorldAction(world,p,action,REGIONS,at),tick:at=>advanceRealmWorld(world,[p],REGIONS,at)};}
test('postura PK exige campo aberto e aparece na reputação persistente',()=>{
 const f=fixture();
 assert.throws(()=>f.act({type:'world-pk-stance',enabled:true}),/santuário/i);
 Object.assign(f.s,{x:50,y:30,lastCombatAt:epoch-13000});
 f.act({type:'world-pk-stance',enabled:true});
 assert.equal(f.p.realm.karma.pkMode,true);
 f.act({type:'world-pk-stance',enabled:false},epoch+1000);
 assert.equal(f.p.realm.karma.pkMode,false);
});
test('movimento após atraso de rede recupera tempo sem ultrapassar o relógio do servidor',()=>{
 const f=fixture();Object.assign(f.s,{x:50,y:50,moveAt:epoch-250});
 f.act({type:'world-move',dx:1,dy:0,power:1,elapsedMs:100,sequence:1},epoch+100);
 const first=f.s.x;
 f.act({type:'world-move',dx:1,dy:0,power:1,elapsedMs:700,sequence:2},epoch+800);
 assert.ok(f.s.x>first,'o pacote acumulado não deve perder o avanço');
 const second=f.s.x;
 f.act({type:'world-move',dx:1,dy:0,power:1,elapsedMs:750,sequence:3},epoch+900);
 assert.ok(f.s.x-second<=WORLD_RULES.speed*.1/WORLD_RULES.aspect+.001,'tempo informado não pode superar o tempo real');
});
test('Recursos renovam no local; produção cobra materiais uma vez e coleta não duplica estoque',()=>{
 const f=fixture(),a=f.w.actors.find(a=>a.kind==='resource'&&a.node==='haven'&&a.resource==='timber');Object.assign(f.s,{x:a.x,y:a.y});
 const material=f.p.realm.materials.timber;f.act({type:'world-interact',targetId:a.id});assert.equal(f.p.realm.materials.timber,material);assert.ok(f.s.harvest?.endsAt>epoch);assert.throws(()=>f.act({type:'world-interact',targetId:a.id},epoch+300));
 f.tick(epoch+WORLD_RULES.harvestMs.timber+300);assert.equal(f.p.realm.materials.timber,material+3);assert.equal(a.hp,0);
 const afterRespawn=a.respawnAt+500;f.tick(afterRespawn);assert.equal(a.hp,1);assert.equal(a.x,a.homeX);assert.equal(a.y,a.homeY);assert.equal(f.p.realm.adventure.stats.gathers,1);
 const node=REGIONS.find(n=>n.resource==='timber'),slot=f.w.slots.find(s=>s.node===node.id&&s.kind==='resource');Object.assign(f.s,{x:slot.x,y:slot.y});
 const before=f.p.realm.materials.timber;f.act({type:'world-deploy',slotId:slot.id,blueprintId:'lumbermill'},afterRespawn+500);assert.equal(f.p.realm.materials.timber,before-3);
 assert.throws(()=>f.act({type:'world-deploy',slotId:slot.id,blueprintId:'lumbermill'},afterRespawn+1500));assert.equal(f.p.realm.materials.timber,before-3);
 f.tick(afterRespawn+21500);f.act({type:'world-interact',targetId:slot.id},afterRespawn+22000);assert.equal(slot.occupant.stock,0);assert.equal(f.p.realm.materials.timber,before-2);assert.throws(()=>f.act({type:'world-interact',targetId:slot.id},afterRespawn+22500));
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
test('Morte tem retorno automático, pacto pago e espólio recuperável uma vez',t=>{
 t.mock.method(Math,'random',()=>.8);
 const f=fixture(),a=f.w.actors.find(a=>a.kind==='hostile'&&a.node!=='haven');Object.assign(f.s,{x:a.x,y:a.y,hp:1});a.attackAt=epoch;const coins=f.p.coins;f.tick(epoch+250);assert.equal(f.s.hp,1);assert.ok(a.windup);f.tick(a.windup.endsAt+250);assert.equal(f.s.hp,0);const bag=f.w.actors.find(a=>a.kind==='satchel');assert.ok(bag);assert.ok(coins-f.p.coins<=20);
 const returnedAt=f.s.downUntil+500;f.tick(returnedAt);assert.ok(f.s.hp>=Math.ceil(f.s.maxHp*.35)&&f.s.hp<=Math.ceil(f.s.maxHp*.35)+1);assert.equal(f.p.realm.location,'haven');assert.equal(f.s.downUntil,0);Object.assign(f.s,{x:bag.x,y:bag.y});f.act({type:'world-interact',targetId:bag.id},returnedAt+1000);assert.equal(f.p.coins,coins);assert.throws(()=>f.act({type:'world-interact',targetId:bag.id},returnedAt+1500));
 const paid=fixture(),beforeCoins=paid.p.coins,beforeEssence=paid.p.realm.materials.essence;paid.s.hp=0;paid.s.downUntil=epoch+12000;paid.act({type:'world-recover'},epoch+1000);assert.equal(paid.s.hp,Math.ceil(paid.s.maxHp*.55));assert.equal(paid.p.coins,beforeCoins-25);assert.equal(paid.p.realm.materials.essence,beforeEssence-1);assert.equal(paid.p.realm.location,'haven');
});
test('Vitória na Arena devolve vida e desperta quem caiu no reino',()=>{
 const f=fixture();f.s.hp=40;let result=grantArenaAfterglow(f.world,f.p,REGIONS,epoch+1000);assert.equal(f.s.hp,65);assert.match(result.message,/25 de vida/);
 f.s.hp=0;f.s.downUntil=epoch+12000;result=grantArenaAfterglow(f.world,f.p,REGIONS,epoch+2000);assert.equal(f.s.hp,40);assert.equal(f.s.downUntil,0);assert.equal(f.p.realm.location,'haven');assert.match(result.message,/despertou/);
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
