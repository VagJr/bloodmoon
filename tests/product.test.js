import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGame,applyAction,publicView} from '../shared/engine.js';
import {createWorld,enterRealms,realmAction,settleEncounter,prepareEncounter} from '../shared/realms.js';
import {CHAPTERS,chapterProgress} from '../shared/adventure.js';
import {MatchQueue} from '../server/matchmaking.js';

test('cinematic sequence retains summon, hit, death and safe board state in order',()=>{
 let game=createGame('vampire',()=>.4);const play=game.players[0].hand.find(c=>c.cardId==='thrall')||game.players[0].hand[0];
 game=applyAction(game,0,{type:'play',uid:play.uid,lane:'hunt'},{visuals:true});
 assert.deepEqual(game.events.slice(0,2).map(e=>e.type),['play','summon']);
 assert.ok(game.events[1].visual.players[0].lanes.hunt.length===1);
 const publicGame=publicView(game,1),encoded=JSON.stringify(publicGame.events);
 assert.equal(/"itemId"|"itemBound"|"deck"|"hand":/.test(encoded),false);
 assert.equal(game.events.at(-1).type,'settled');assert.equal(game.events.at(-1).visual.turn,1);
 const before=structuredClone(game);assert.throws(()=>applyAction(game,1,{type:'play',uid:'nonexistent',lane:'hunt'},{visuals:true}));assert.deepEqual(game,before);
});
test('campaign is playable through eight chapters and rewards cannot be claimed twice',()=>{
 let serial=0;const id=()=>`item-${++serial}`,world=createWorld(),p={id:'p',name:'Teste',starterFaction:'vampire',coins:500,dust:0,scrap:0,items:[]};enterRealms(p,id,1000000);
 const action=(type,extra={},now=1000000)=>realmAction(world,p,{type,version:p.realm.version,...extra},id,now);
 assert.throws(()=>action('chapter',{choice:'shelter'}));assert.equal(p.coins,500);
 p.realm.visited=['haven','quarry','rosekeep'];p.realm.adventure.stats.gathers=2;
 assert.equal(chapterProgress(p.realm).ready,true);action('chapter',{choice:'shelter'});assert.equal(p.coins,540);
 assert.throws(()=>action('chapter',{choice:'shelter'}));assert.equal(p.coins,540);
 p.realm.visited=['haven','quarry','rosekeep','crown','observatory','citadel','moonwood','lake','crypt','abbey'];p.realm.adventure.stats.wins=12;p.realm.adventure.stats.dungeons=3;p.realm.holdings.forge=1;p.realm.holdings.library=1;p.realm.level=5;p.realm.xp=480;
 for(const chapter of CHAPTERS.slice(1,8))action('chapter',{choice:chapter.choices[0][0]});
 assert.equal(p.realm.adventure.chapter,8);assert.equal(p.items.length,5);assert.equal(new Set(p.realm.adventure.claimed).size,8);
 assert.throws(()=>action('chapter',{choice:'union'}));
});
test('exploration talents, relief and daily economy respect costs and claim limits',()=>{
 let serial=0;const id=()=>String(++serial),world=createWorld(),p={id:'p',name:'Teste',starterFaction:'werewolf',coins:100,dust:0,scrap:0};enterRealms(p,id,1000000);
 const act=(type,extra={},now=1000000)=>realmAction(world,p,{type,version:p.realm.version,...extra},id,now);
 assert.throws(()=>act('talent',{talent:'scout'}));p.realm.level=2;p.realm.xp=120;act('talent',{talent:'scout'});assert.throws(()=>act('talent',{talent:'artisan'}));
 act('travel',{destination:'quarry'});act('gather');assert.equal(p.realm.materials.ore,4);assert.throws(()=>act('gather'));
 p.realm.location='haven';p.realm.provisions=0;act('relief');assert.equal(p.realm.provisions,8);p.realm.provisions=0;assert.throws(()=>act('relief'));
 p.realm.adventure.daily={day:new Date(1000000).toISOString().slice(0,10),gathers:3,wins:2,claimed:false};act('daily-claim');assert.equal(p.coins,160);assert.throws(()=>act('daily-claim'));
});
test('matchmaking expands rating range, never pairs self and expires abandoned tickets',()=>{
 const q=new MatchQueue();assert.equal(q.join({id:'a',rating:1000},'vampire',0).candidates.length,0);
 assert.equal(q.join({id:'a',rating:1000},'vampire',100).candidates.length,0);
 assert.equal(q.join({id:'b',rating:1450},'vampire',100).candidates.length,0);
 for(let t=10000;t<=60000;t+=10000){q.join({id:'a',rating:1000},'vampire',t);q.join({id:'b',rating:1450},'vampire',t);}
 assert.equal(q.join({id:'a',rating:1000},'vampire',61000).candidates[0].id,'b');q.prune(90000);assert.equal(q.entries.size,0);
});
test('account persistence, legacy linking, logout, matchmaking and video streaming work end to end',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'bloodmoon-product-'));let server,origin;
 const boot=async()=>{server=spawn(process.execPath,['server/index.js'],{env:{...process.env,MONGO_URI:'',NODE_ENV:'test',PORT:'0',HOST:'127.0.0.1',DATA_DIR:directory},stdio:['ignore','pipe','pipe']});origin=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),8000);server.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});};
 const stop=async()=>{if(server&&server.exitCode===null){const exit=once(server,'exit');server.kill();await exit;}};
 const req=async(url,method='GET',data,cookie='',token='')=>{const r=await fetch(origin+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],rawCookie:r.headers.get('set-cookie')};};
 try{
  await boot();const legacy=await req('/api/profile','POST',{name:'Existing',faction:'vampire'});
  const a=await req('/api/auth/register','POST',{email:'a@example.test',password:'correct horse password',name:'Existing',claimLegacy:true},'',legacy.data.id);
  assert.equal(a.status,200);assert.equal(a.data.profile.id,legacy.data.id);assert.match(a.rawCookie,/HttpOnly/);assert.match(a.rawCookie,/SameSite=Lax/);
  assert.equal((await req('/api/profile','GET',null,'',a.data.profile.id)).status,401);
  assert.equal((await req('/api/profile','GET',null,a.cookie)).status,200);
  assert.equal(JSON.stringify(a.data).includes('passwordHash'),false);
  const b=await req('/api/auth/register','POST',{email:'b@example.test',password:'another correct password',name:'Rival',faction:'vampire'});assert.equal(b.status,200);
  assert.equal(b.data.profile.onboardingComplete,false);assert.equal(b.data.profile.starterFaction,undefined);
  const onboard=await req('/api/onboarding','POST',{faction:'vampire'},b.cookie);assert.equal(onboard.status,200);assert.equal(onboard.data.profile.decks.length,1);assert.equal(onboard.data.profile.coins,60);
  const again=await req('/api/onboarding','POST',{faction:'werewolf'},b.cookie);assert.equal(again.data.profile.coins,60);assert.equal(again.data.profile.starterFaction,'vampire');
  assert.equal((await req('/api/auth/login','POST',{email:'a@example.test',password:'incorrect'})).status,401);
  assert.equal((await req('/api/auth/register','POST',{email:'a@example.test',password:'duplicate password',name:'Duplicate'})).status,400);
  assert.equal((await req('/api/matchmaking','POST',{faction:'vampire'},a.cookie)).data.state,'searching');
  assert.equal((await req('/api/matchmaking','POST',{faction:'vampire'},b.cookie)).status,403);
  assert.equal((await req('/api/boosters/open','POST',{},b.cookie)).status,403);
  assert.equal((await req('/api/realms','GET',null,b.cookie)).status,403);
  assert.equal((await req('/api/journey/lesson','POST',{id:'forge',step:1},b.cookie)).status,403);
  assert.equal((await req('/api/journey/lesson','POST',{id:'welcome',step:1},b.cookie)).status,200);
  assert.equal((await req('/api/profile','GET',null,b.cookie)).data.journey.lessons.welcome.step,1);
  const challenger=await req('/api/profile','POST',{name:'Challenger',faction:'vampire'});
  const paired=await req('/api/matchmaking','POST',{faction:'vampire'},'',challenger.data.id);assert.equal(paired.data.state,'matched');
  const cancel=await req('/api/matchmaking','DELETE',null,a.cookie);assert.equal(cancel.data.roomId,paired.data.roomId);
  const room=await req('/api/rooms/'+paired.data.roomId,'GET',null,a.cookie);assert.deepEqual(room.data.players.map(p=>p.faction),['vampire','vampire']);assert.equal(room.data.waiting,false);assert.equal(room.data.players[1].hand,undefined);
  const turn=await req('/api/rooms/'+paired.data.roomId+'/actions','POST',{version:room.data.version,action:{type:'skill',lane:'hunt',target:'hero'}},a.cookie);assert.equal(turn.status,200);assert.ok(turn.data.events.some(e=>e.visual));
  const video=await fetch(origin+'/assets/intro/vespera.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,100);assert.equal(video.headers.get('content-type'),'video/mp4');
  const saved=JSON.parse(await readFile(path.join(directory,'state.json'),'utf8'));assert.equal(saved.accounts.length,2);assert.equal(JSON.stringify(saved).includes('correct horse password'),false);assert.equal(saved.sessions.some(s=>a.cookie.includes(s.id)),false);
  await stop();await boot();assert.equal((await req('/api/auth/session','GET',null,a.cookie)).status,200);
  await req('/api/auth/logout','POST',{},a.cookie);assert.equal((await req('/api/profile','GET',null,a.cookie)).status,401);
  const login=await req('/api/auth/login','POST',{email:'a@example.test',password:'correct horse password'});assert.equal(login.status,200);assert.equal(login.data.profile.id,legacy.data.id);
 }finally{await stop();assert.ok(path.resolve(directory).startsWith(path.resolve(tmpdir())+path.sep+'bloodmoon-product-'));await rm(directory,{recursive:true,force:true});}
});
