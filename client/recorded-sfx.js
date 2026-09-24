// User-supplied recordings. Short excerpts, normalization and voice limits happen locally.
const pool=(ids,gain=1,duration=2,rate=1)=>({ids:ids.split(' '),gain,duration,rate});
export const RECORDED_CUES={
 'start-button':pool('start-button',.7,3),
 summon:pool('card-invocation',.65,1.5),
 navigate:pool('ui-click',.25,.22),close:pool('ui-click',.2,.18,.88),select:pool('ui-click',.2,.16,1.06),card:pool('unsheath',.3,.45,1.1),
 coins:pool('gold',.65,1.5),loot:pool('gold',.7,1.6),victory:pool('magic-spell gold',.7,3),level:pool('magic-spell',.65,2.5,1.08),
 'coin-tap':pool('gold',.12,.16,1.15),
 forge:pool('steel-impact',.7,1.2,.8),repair:pool('steel-impact shield',.5,.85),equip:pool('unsheath',.7,1.4),'item-break':pool('steel-impact',.65,1,.75),
 attack:pool('sword-slash-1 sword-slash-2 claw-1 claw-2',.65,1),
 'attack-steel':pool('sword-slash-1 sword-slash-2 steel-impact',.68,1),
 'attack-vampire':pool('sword-slash-1 sword-slash-2',.58,.9),
 'attack-werewolf':pool('claw-1 claw-2 claw-3',.68,1.15),
 'voice-vampire':pool('vampire-hiss-1 vampire-hiss-2 vampire-hiss-3',.36,1.4),
 'voice-wolf':pool('wolf-growl monster-attack beast-roar',.38,1.8),
 damage:pool('flesh-impact',.65,.8),'damage-heavy':pool('flesh-impact monster-attack',.72,1.15,.88),
 shield:pool('shield',.7,1.4),clash:pool('steel-impact claw-3',.7,1.3),death:pool('fighter-grunt monster-attack',.52,1.3,.92),
 drain:pool('vampire-hiss-1 vampire-hiss-2 vampire-hiss-3',.65,1.6,.85),heal:pool('magic-spell',.4,1.8,1.15),
 blood:pool('vampire-hiss-1 vampire-hiss-2 vampire-hiss-3',.48,1.3),claw:pool('wolf-growl monster-attack',.5,1.5),
 steel:pool('unsheath',.65,1.3),moon:pool('magic-spell',.5,2,1.12),court:pool('teleport',.22,.75,.95),grave:pool('teleport',.22,.85,.78),flame:pool('magic-spell',.6,1.8,.85),
 skill:pool('magic-spell',.6,2),start:pool('teleport',.5,1.5),synergy:pool('magic-spell',.4,1.2,1.18),
 ultimate:pool('vampire-shriek',.7,2.5),'ultimate-werewolf':pool('wolf-howl',.72,3),curse:pool('vampire-shriek',.55,2,.8),
 defeat:pool('wolf-growl',.45,2,.8),combo:pool('claw-3',.55,1.1),round:pool('shield',.4,.85,.9),
 'hero-shatter':pool('steel-impact',.85,1.5,.7)
};
export function createRecordedSfx(context,output){
 const buffers=new Map(),pending=new Map(),previous=new Map(),last=new Map(),voices=new Set();let warming=false,muted=false;
 async function load(id){
  if(buffers.has(id))return buffers.get(id);if(pending.has(id))return pending.get(id);
  const promise=(async()=>{
   try{
    const response=await fetch(`/assets/sfx/${id}.mp3`);if(!response.ok)throw new Error('Missing audio');
    const buffer=await context.decodeAudioData(await response.arrayBuffer());
    let peak=0,first=buffer.length,lastSample=0;
    for(let ch=0;ch<buffer.numberOfChannels;ch++){
     const samples=buffer.getChannelData(ch);
     for(let i=0;i<samples.length;i++){const v=Math.abs(samples[i]);peak=Math.max(peak,v);if(v>.003){first=Math.min(first,i);lastSample=Math.max(lastSample,i);}}
    }
    const offset=Math.max(0,first/buffer.sampleRate-.012),end=Math.min(buffer.duration,lastSample/buffer.sampleRate+.08);
    const clip={buffer,offset,duration:Math.max(.02,end-offset),level:Math.min(2,.82/Math.max(.1,peak))};buffers.set(id,clip);return clip;
   }catch{return null;}
  })();pending.set(id,promise);return promise;
 }
 function warm(){
  if(warming)return warming;
  const ids=[...new Set(Object.values(RECORDED_CUES).flatMap(c=>c.ids))];
  // Three decode workers keep startup bounded on mobile. No late replay after loading.
  warming=Promise.all(Array.from({length:3},async()=>{while(ids.length)await load(ids.shift());}));return warming;
 }
 function play(type,pan=0,delay=0){
  const cue=RECORDED_CUES[type];if(!cue)return false;if(muted)return true;
  const now=context.currentTime,ui=['navigate','close','select','card'].includes(type),vocal=type.startsWith('voice-');
  const group=ui?'ui':vocal?'voice':type,cooldown=ui?.055:vocal?1.15:.065;
  if(now-(last.get(group)??-100)<cooldown)return true;
  const ready=cue.ids.filter(id=>buffers.has(id));if(!ready.length){cue.ids.forEach(load);return false;}
  if(voices.size>=12||ui&&[...voices].filter(v=>v.ui).length>=2)return true;
  const options=ready.filter(id=>id!==previous.get(type)),choices=options.length?options:ready,id=choices[Math.floor(Math.random()*choices.length)];
  previous.set(type,id);last.set(group,now);
  const clip=buffers.get(id),source=context.createBufferSource(),gain=context.createGain();source.buffer=clip.buffer;
  const rate=cue.rate*(ui?1:.97+Math.random()*.06),duration=Math.min(clip.duration/rate,cue.duration),start=now+delay;
  source.playbackRate.value=rate;source.connect(gain);
  const panner=context.createStereoPanner?.();if(panner){panner.pan.value=Math.max(-.7,Math.min(.7,pan));gain.connect(panner);panner.connect(output);}else gain.connect(output);
  const volume=cue.gain*clip.level;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.006);gain.gain.setValueAtTime(volume,start+Math.max(.007,duration-.07));gain.gain.linearRampToValueAtTime(0,start+duration);
  const entry={source,gain,panner,ui};voices.add(entry);
  source.onended=()=>{voices.delete(entry);source.disconnect();gain.disconnect();panner?.disconnect();};
  source.start(start,clip.offset);source.stop(start+duration+.01);return true;
 }
 return {warm,play,async playReady(type,pan=0){const requested=performance.now();await Promise.all((RECORDED_CUES[type]?.ids||[]).map(load));if(!muted&&performance.now()-requested<1500)play(type,pan);},setMuted(value){muted=value;if(value)for(const v of voices){try{v.source.stop();}catch{}}}};
}
