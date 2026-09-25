import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureKarma,karmaView,recordCreatureKill,recordPlayerKill,canAttackPlayer} from '../shared/realm-karma.js';

const now=1800000000000;
const profile=(id,faction='vampire')=>({id,starterFaction:faction,coins:0,realm:{houseId:null}});

test('oito graus de caça exigem uma jornada longa e preservam os quatro brasões da linhagem',()=>{
 const hunter=profile('hunter','werewolf');
 assert.match(karmaView(hunter,now).icon,/werewolf-white\.webp$/);
 for(let i=0;i<3;i++)recordCreatureKill(hunter,{kind:'hostile',level:10},now+i);
 assert.equal(karmaView(hunter,now).rank,'white');
 for(let i=0;i<10;i++)recordCreatureKill(hunter,{kind:'raid',level:12},now+i+10);
 assert.equal(karmaView(hunter,now).rank,'red-ii');
 for(let i=0;i<90;i++)recordCreatureKill(hunter,{kind:'raid',level:12},now+i+20);
 assert.equal(karmaView(hunter,now).rank,'gold');
 for(let i=0;i<3;i++)recordCreatureKill(hunter,{kind:'raid',level:12},now+i+120);
 assert.equal(karmaView(hunter,now).rank,'gold-ii');
 assert.equal(karmaView(hunter,now).bossKills,103);
 assert.match(karmaView(hunter,now).icon,/werewolf-gold\.webp$/);
});

test('combo de caça expira sem apagar o renome permanente e chefes deixam um surto próprio',()=>{
 const hunter=profile('combo');
 for(let i=0;i<6;i++)recordCreatureKill(hunter,{kind:'hostile',level:8},now+i*1000);
 assert.equal(karmaView(hunter,now+5000).comboTier,2);
 const score=karmaView(hunter,now+5000).score;
 assert.equal(karmaView(hunter,now+18000).comboCount,0);
 assert.equal(karmaView(hunter,now+18000).score,score);
 recordCreatureKill(hunter,{kind:'raid',level:12},now+19000);
 assert.equal(karmaView(hunter,now+19000).comboCount,1);
 assert.equal(karmaView(hunter,now+19000).lastBossKillAt,now+19000);
});

test('assassinato cria procura e recompensa; vítima repetida não gera pontuação',()=>{
 const killer=profile('killer'),victim=profile('victim','werewolf');
 assert.equal(canAttackPlayer({},killer,victim,now),false);
 ensureKarma(killer).pkMode=true;
 assert.equal(canAttackPlayer({},killer,victim,now),true);
 const first=recordPlayerKill(killer,victim,now);
 assert.equal(first.awarded,true);assert.equal(first.lawful,false);
 assert.equal(karmaView(killer,now).murders,1);
 assert.equal(karmaView(killer,now).pkTitle,'Proscrito');
 assert.ok(karmaView(killer,now).bounty>0);
 assert.equal(recordPlayerKill(killer,victim,now+1000).awarded,false);
 assert.equal(karmaView(killer,now+1000).playerKills,1);
 assert.equal(karmaView(victim,now+1000).deaths,2);
});

test('guerra e caça a proscritos são legítimas e pagam recompensa',()=>{
 const rogue=profile('rogue'),hunter=profile('hunter','werewolf');
 ensureKarma(rogue).wantedUntil=now+60000;ensureKarma(rogue).bounty=40;
 assert.equal(canAttackPlayer({},hunter,rogue,now),true);
 const deed=recordPlayerKill(hunter,rogue,now);
 assert.equal(deed.lawful,true);assert.equal(deed.bountyClaimed,40);
 assert.equal(hunter.coins,40);assert.equal(karmaView(hunter,now).murders,0);
 const a=profile('a'),b=profile('b');a.realm.houseId='north';b.realm.houseId='south';
 assert.equal(canAttackPlayer({warPairs:[['north','south']]},a,b,now),true);
 assert.equal(recordPlayerKill(a,b,now,{war:true}).lawful,true);
});
