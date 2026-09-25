import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {grantStarter} from '../shared/progression.js';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldAction} from '../shared/realm-world.js';
import {rollD20,ensureRpg,gainRpg,rpgChoice,rpgStats} from '../shared/realm-rpg.js';
import {actionCombat,enemyAttack,advanceActionCombat} from '../shared/realm-action-combat.js';
import {campaignAction,campaignView,advanceCampaign} from '../shared/realm-campaign.js';
const now=1800000000000;
function fixture(){const p={id:randomUUID(),name:'Teste',xp:0,level:1,matches:0,wins:0,trophies:[]};grantStarter(p,'vampire',randomUUID);enterRealms(p,randomUUID,now);const world=createWorld(),w=ensureRealmWorld(world,REGIONS,now),s=ensureWorldPlayer(p,REGIONS,now);p.realm.materials={timber:100,ore:100,essence:100};Object.assign(s,{x:30,y:50});return {p,world,w,s};}
test('d20: extremos, vantagem e crítico dobram dados, com recarga sem débito repetido',()=>{
 assert.equal(rollD20(-100,30,()=>.999).critical,true);assert.equal(rollD20(100,1,()=>0).hit,false);let rolls=[0,.99];assert.deepEqual(rollD20(0,10,()=>rolls.shift(),1).rolls,[1,20]);
 const {p,w,s}=fixture(),a=w.actors.find(a=>a.kind==='hostile');Object.assign(a,{x:31,y:50,hp:100});let dealt=0;
 const hit=(_,t,d)=>{dealt=d;t.hp-=d;};actionCombat(w,p,{ability:'strike',targetId:a.id},REGIONS,now,hit,()=>.999);assert.equal(dealt,0);advanceActionCombat(w,[p],REGIONS,now+160,hit,()=>.999);assert.equal(dealt,13);assert.equal(w.combatEvents.at(-1).kind,'critical');
 assert.throws(()=>actionCombat(w,p,{ability:'strike',targetId:a.id},REGIONS,now+100,()=>{}),/recuperando/);assert.equal(a.hp,87);assert.equal(s.energy,100);
});
test('esquiva evita golpe; barreira absorve dano e recursos insuficientes não alteram estado',()=>{
 const {p,w,s}=fixture(),a=w.actors.find(a=>a.kind==='hostile');a.attack=10;
 actionCombat(w,p,{ability:'dash',dx:1,dy:0},REGIONS,now,()=>{});assert.ok(s.x>30);assert.equal(enemyAttack(w,a,p,now+200,()=>.8),0);
 Object.assign(a,{x:s.x+1.2,y:s.y,attackType:'physical'});actionCombat(w,p,{ability:'guard'},REGIONS,now+500,()=>{});const shield=p.rpg.barrier.hp;assert.equal(enemyAttack(w,a,p,now+600,()=>.8),0);assert.equal(p.rpg.barrier.hp,shield-10);
 p.rpg.mana=0;assert.throws(()=>actionCombat(w,p,{ability:'bolt',x:s.x,y:s.y},REGIONS,now+1000,()=>{}),/mana/);assert.equal(p.rpg.cooldowns.bolt,undefined);
});
test('personagem: pontos não duplicam, vocação permanente, talentos, equipamento e grimório persistem',()=>{
 const {p}=fixture();gainRpg(p,1200);assert.equal(p.rpg.level,4);rpgChoice(p,{type:'rpg-path',path:'stalker'});assert.equal(rpgStats(p).attributes.dexterity,14);assert.throws(()=>rpgChoice(p,{type:'rpg-path',path:'sentinel'}));
 for(let i=0;i<6;i++)rpgChoice(p,{type:'rpg-attribute',attribute:'strength'});assert.throws(()=>rpgChoice(p,{type:'rpg-attribute',attribute:'strength'}));
 rpgChoice(p,{type:'rpg-talent',talent:'vitality'});assert.ok(rpgStats(p).maxHp>120);rpgChoice(p,{type:'rpg-loadout',slot:0,ability:'drain'});assert.equal(ensureRpg(JSON.parse(JSON.stringify(p))).loadout[0],'drain');assert.throws(()=>rpgChoice(p,{type:'rpg-loadout',slot:1,ability:'tempest'}));
});
test('conselho: custos atômicos, projetos, crises e prêmios únicos; resultado de expedição fica no servidor',()=>{
 const {p}=fixture();campaignAction(p,{type:'campaign-project',id:'bastion'},now);assert.equal(rpgStats(p).defense,12);
 campaignAction(p,{type:'campaign-dispatch',id:'caravan'},now);const exp=p.campaign.expeditions[0];assert.equal(campaignView(p,now).expeditions[0].success,undefined);assert.throws(()=>campaignAction(p,{type:'campaign-expedition-claim',id:exp.id},now));exp.success=true;campaignAction(p,{type:'campaign-expedition-claim',id:exp.id},now+120001);assert.throws(()=>campaignAction(p,{type:'campaign-expedition-claim',id:exp.id},now+120002));
 advanceCampaign(p,now);advanceCampaign(p,now+300001);assert.ok(p.campaign.crisis);campaignAction(p,{type:'campaign-crisis',id:'ration'},now+300002);assert.equal(p.campaign.crisis,null);
 p.realm.materials.timber=0;const before=structuredClone(p);assert.throws(()=>campaignAction(p,{type:'campaign-project',id:'granary'},now));assert.deepEqual(p,before);
});
test('expansão preserva mundo existente, cria rotas e permite movimento analógico na nova fronteira',()=>{
 const {world,w,p,s}=fixture();const original=w.actors[0];original.hp=5;w.contentVersion=3;ensureRealmWorld(world,REGIONS,now);assert.equal(w.actors[0],original);assert.equal(original.hp,5);assert.ok(w.actors.some(a=>a.id==='road-lake-frostport'));assert.equal(new Set(w.actors.map(a=>a.id)).size,w.actors.length);
 s.x=100;realmWorldAction(world,p,{type:'world-move',dx:1,dy:0,power:.5,elapsedMs:250,sequence:1},REGIONS,now+250);assert.ok(s.x>100.25&&s.x<100.3);assert.equal(REGIONS.length,27);
});
