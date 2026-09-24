import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRecordedSfx,RECORDED_CUES} from '../client/recorded-sfx.js';

test('recorded cues reference all 24 unique imported samples',()=>{
 const imports=JSON.parse(readFileSync(new URL('../docs/audio/imported-sfx.json',import.meta.url)));
 const ids=new Set(Object.values(RECORDED_CUES).flatMap(c=>c.ids));assert.equal(ids.size,24);
 assert.deepEqual(RECORDED_CUES.summon.ids,['card-invocation']);
 for(const id of ids){const asset=imports.files.find(a=>a.id===id);assert.ok(asset,id);assert.equal(readFileSync(new URL('../client'+asset.file,import.meta.url)).length,asset.bytes);}
 assert.equal(new Set(imports.files.map(a=>a.sha256)).size,24);
});
test('sample mixer preloads once, varies takes, bounds voices and stops on mute',async()=>{
 const oldFetch=globalThis.fetch,sources=[];let fetches=0;
 const node=()=>({connect(){},disconnect(){}}),param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){}});
 const context={currentTime:0,decodeAudioData:async()=>({length:1000,sampleRate:1000,duration:1,numberOfChannels:1,getChannelData:()=>Float32Array.from({length:1000},(_,i)=>i>20&&i<950?.5:0)}),createGain:()=>({...node(),gain:param()}),createStereoPanner:()=>({...node(),pan:param()}),createBufferSource:()=>{const s={...node(),playbackRate:param(),start(...args){this.started=args;},stop(){this.stopped=true;}};sources.push(s);return s;}};
 globalThis.fetch=async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
 try{
  const mixer=createRecordedSfx(context,node());await mixer.warm();await mixer.warm();assert.equal(fetches,24);
  assert.equal(mixer.play('attack-steel'),true);const first=sources.at(-1).buffer;context.currentTime+=.2;mixer.play('attack-steel');assert.notEqual(sources.at(-1).buffer,first);
  assert.ok(sources[0].started[1]>0,'leading silence trimmed');
  for(let i=0;i<20;i++){context.currentTime+=.2;mixer.play('damage');}assert.equal(sources.length,12);
  mixer.setMuted(true);assert.ok(sources.every(s=>s.stopped));context.currentTime+=1;mixer.play('coins');assert.equal(sources.length,12);
  for(const s of sources)s.onended();mixer.setMuted(false);mixer.play('coins');assert.equal(sources.length,13);
 }finally{globalThis.fetch=oldFetch;}
});
