import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter} from '../shared/progression.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldView} from '../shared/realm-world.js';

test('Mundo online: autenticação, movimento limitado, presença pública, consentimento PvP e Arena persistente',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'bloodmoon-world-api-'));
  const now=Date.now(),world=createWorld();ensureRealmWorld(world,REGIONS,now);
  const people=['Aurora','Breno','Caçadora'].map((name,index)=>{
    const p={id:`private-player-${index}`,name,xp:0,level:1,matches:0,wins:0,trophies:[]};
    grantStarter(p,index===1?'werewolf':'vampire',randomUUID);enterRealms(p,randomUUID,now);ensureWorldPlayer(p,REGIONS,now);return p;
  });
  const [a,b,hunter]=people,projection=realmWorldView(world,hunter,new Map(people.map(p=>[p.id,p])),REGIONS,now);
  const target=projection.actors.find(actor=>actor.arenaKind==='boss');
  assert.ok(target,'Há um chefe no mundo inicial.');
  hunter.realm.location=target.node;hunter.realm.level=10;hunter.realm.xp=1080;
  Object.assign(hunter.realm.roaming,{x:target.x,y:target.y});
  await writeFile(path.join(directory,'state.json'),JSON.stringify({schema:3,world,profiles:people,rooms:[],accounts:[],sessions:[]}));
  const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,MONGO_URI:'',NODE_ENV:'test',PORT:'0',HOST:'127.0.0.1',DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  let errors='';child.stderr.on('data',chunk=>{errors+=chunk;});
  try{
    const origin=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error(`Servidor não iniciou: ${errors}`)),7000);
      child.stdout.on('data',chunk=>{const match=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
      child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Servidor encerrou: ${code} ${errors}`));});
    });
    const request=async(route,method='GET',data,token=a.id)=>{
      const response=await fetch(origin+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});
      return {status:response.status,data:await response.json()};
    };
    assert.equal((await request('/api/realms/world','GET',undefined,null)).status,401);
    const initial=(await request('/api/realms/world')).data.liveWorld;
    assert.ok(initial.actors.length>10);assert.ok(initial.slots.length>10);
    assert.ok(!JSON.stringify(initial.players).includes('private-player-'));
    const defenderView=(await request('/api/realms/world','GET',undefined,b.id)).data.liveWorld;
    const defended=await request('/api/realms/world/action','POST',{type:'world-ability',ability:'guard',snapshotAt:defenderView.serverTime},b.id);
    assert.equal(defended.status,200,JSON.stringify(defended.data));
    assert.equal(defended.data.liveWorld.partial,true);
    assert.equal(defended.data.liveWorld.rules,undefined);
    assert.equal(defended.data.liveWorld.rpg.barrier.kind,'guard');
    const moved=await request('/api/realms/world/action','POST',{type:'world-move',dx:1,dy:0,elapsedMs:250,sequence:1});
    assert.equal(moved.status,200,JSON.stringify(moved.data));assert.equal(moved.data.profile,undefined);
    assert.ok(moved.data.movement,'O movimento comum retorna apenas a confirmação de posição.');
    assert.equal(moved.data.liveWorld,undefined);
    const distance=Math.hypot((moved.data.movement.x-initial.player.x)*1.5,moved.data.movement.y-initial.player.y);
    assert.ok(distance<=initial.rules.speed*.3,'O servidor limita a distância a um passo autorizado.');
    const duplicate=await request('/api/realms/world/action','POST',{type:'world-move',dx:1,dy:0,elapsedMs:250,sequence:1});
    assert.ok(duplicate.status===400||duplicate.data.movement?.x===moved.data.movement.x,'Repetir a sequência não duplica o passo.');
    const injected=await request('/api/realms/world/action','POST',{type:'world-move',dx:1,dy:0,elapsedMs:900000,sequence:2,x:99,y:99});
    if(injected.status===200)assert.ok(Math.abs(injected.data.movement.x-moved.data.movement.x)<1,'Coordenadas do cliente não teleportam.');
    else assert.equal(injected.status,400);

    const controller=new AbortController(),stream=await fetch(origin+'/api/realms/events',{headers:{Authorization:`Bearer ${a.id}`},signal:controller.signal});
    const reader=stream.body.getReader(),chunk=new TextDecoder().decode((await reader.read()).value);
    assert.match(chunk,/event: realm-live/);assert.ok(!chunk.includes(b.id));controller.abort();await reader.cancel().catch(()=>{});

    const challenge=await request('/api/realms/world/encounter','POST',{playerId:b.realm.publicId});
    assert.equal(challenge.status,202,JSON.stringify(challenge.data));assert.equal(challenge.data.roomId,undefined);
    const invited=(await request('/api/realms/world','GET',undefined,b.id)).data.liveWorld;
    assert.equal(invited.challenges[0].playerId,a.realm.publicId);
    const accepted=await request('/api/realms/world/encounter','POST',{playerId:a.realm.publicId},b.id);
    assert.equal(accepted.status,201,JSON.stringify(accepted.data));assert.equal(accepted.data.mode,'duel');
    const duel=accepted.data;
    assert.equal((await request('/api/realms/world/action','POST',{type:'world-move',dx:1,dy:0,elapsedMs:100,sequence:4})).status,400);
    assert.equal((await request(`/api/rooms/${duel.roomId}`,'GET',undefined,hunter.id)).status,403);
    const finished=await request(`/api/rooms/${duel.roomId}/actions`,'POST',{version:duel.version,action:{type:'concede'}});
    assert.equal(finished.status,200,JSON.stringify(finished.data));assert.equal(finished.data.phase,'finished');
    assert.equal((await request('/api/realms/world')).data.liveWorld.activeRoom,null);
    assert.equal((await request('/api/realms/world','GET',undefined,b.id)).data.liveWorld.activeRoom,null);

    const encounter=await request('/api/realms/world/encounter','POST',{actorId:target.id},hunter.id);
    assert.equal(encounter.status,201,JSON.stringify(encounter.data));assert.equal(encounter.data.mode,'dungeon');assert.equal(encounter.data.encounter.arena,true);assert.equal(encounter.data.players.length,2);
    assert.equal((await request('/api/realms/world/encounter','POST',{actorId:target.id},hunter.id)).status,400);
    const end=await request(`/api/rooms/${encounter.data.roomId}/actions`,'POST',{version:encounter.data.version,action:{type:'concede'}},hunter.id);
    assert.equal(end.status,200,JSON.stringify(end.data));assert.equal(end.data.phase,'finished');
    assert.equal((await request('/api/realms/world','GET',undefined,hunter.id)).data.liveWorld.activeRoom,null);
    const before=(await request('/api/profile','GET',undefined,hunter.id)).data.coins;
    assert.equal((await request(`/api/rooms/${encounter.data.roomId}/actions`,'POST',{version:end.data.version,action:{type:'concede'}},hunter.id)).status,400);
    assert.equal((await request('/api/profile','GET',undefined,hunter.id)).data.coins,before);
    const saved=JSON.parse(await readFile(path.join(directory,'state.json'),'utf8'));
    assert.ok(saved.world.realmWorld);assert.ok(saved.profiles.find(p=>p.id===a.id).realm.roaming);
    assert.equal(saved.rooms.find(r=>r.id===encounter.data.roomId).rewarded,true);
    assert.equal(errors,'');
  }finally{
    if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}
    await rm(directory,{recursive:true,force:true});
  }
});
