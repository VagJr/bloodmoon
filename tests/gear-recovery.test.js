import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { grantStarter } from '../shared/progression.js';

test('API: exaustão reserva uma carta válida e o reparo devolve o equipamento ao deck',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'bloodmoon-gear-'));
  let nextId=0;const profile={id:'gear-recovery-player',name:'Relicário',xp:0,level:1,wins:0,matches:0,trophies:[]};
  grantStarter(profile,'vampire',()=>`fixture-${++nextId}`);
  const worn=profile.items.find(item=>item.cardId==='ward');worn.durability=0;
  await writeFile(path.join(directory,'state.json'),JSON.stringify({schema:2,profiles:[profile],rooms:[],world:null}));
  const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'test',MONGO_URI:'',PORT:'0',HOST:'127.0.0.1',DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  try{
    const origin=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Servidor não iniciou')),5000);
      server.stdout.on('data',chunk=>{const found=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(found){clearTimeout(timer);resolve(found[0]);}});
      server.once('error',reject);
    });
    const request=async(route,method='GET',data)=>{
      const response=await fetch(origin+route,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${profile.id}`},...(data?{body:JSON.stringify(data)}:{})});
      return {status:response.status,data:await response.json()};
    };
    const readiness=await request('/api/readiness?faction=vampire');
    assert.equal(readiness.status,200);
    assert.equal(readiness.data.canStart,true);
    assert.equal(readiness.data.deck.cards,20);
    assert.equal(readiness.data.deck.autoRefills.length,1);
    assert.equal(readiness.data.deck.autoRefills[0].equipmentId,'ward');
    const inventory=await request('/api/market');
    assert.equal(inventory.data.inventory.find(item=>item.id===worn.id).durability,0);
    const repair=await request('/api/items/repair','POST',{itemId:worn.id});
    assert.equal(repair.status,200);
    assert.ok(repair.data.profile.decks[0].cards.includes('ward'));
    assert.deepEqual(repair.data.profile.decks[0].autoRefills,[]);
    assert.equal((await request('/api/readiness?faction=vampire')).data.canStart,true);
  }finally{
    server.kill();
    if(server.exitCode===null)await once(server,'exit');
    await rm(directory,{recursive:true,force:true});
  }
});
