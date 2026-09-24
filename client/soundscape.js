import {createRecordedSfx} from '/recorded-sfx.js';
let context,master,noise,room,compressor,recordings;
export function muteSoundscape(value){recordings?.setMuted(value);if(master){master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(value?0:.42,context.currentTime,.025);}}
let lastSound=0,activeVoices=0;
function engine(){
 if(context){if(context.state==='suspended')context.resume().catch(()=>{});return context;}
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)throw new Error('Web Audio indisponível');
 context=new AudioContextClass();if(context.state==='suspended')context.resume().catch(()=>{});master=context.createGain();master.gain.value=.42;
 compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.16;master.connect(compressor);const limiter=context.createDynamicsCompressor();limiter.threshold.value=-3;limiter.knee.value=0;limiter.ratio.value=20;limiter.attack.value=.001;limiter.release.value=.09;const rumble=context.createBiquadFilter();rumble.type='highpass';rumble.frequency.value=28;compressor.connect(rumble);rumble.connect(limiter);limiter.connect(context.destination);
 const length=context.sampleRate;noise=context.createBuffer(1,length*2,context.sampleRate);const channel=noise.getChannelData(0);let brown=0;for(let i=0;i<channel.length;i++){const white=Math.random()*2-1;brown=(brown+.025*white)/1.025;channel[i]=white*.65+brown*2.1;}
 room=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(length*.65),context.sampleRate);for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.16;}room.buffer=impulse;const wet=context.createGain();wet.gain.value=.16;room.connect(wet);wet.connect(master);return context;
}
export function unlockSoundscape(){
 try{
  const c=engine();
  recordings||=createRecordedSfx(c,master);recordings.warm();
  if(c.state==='suspended')c.resume().catch(()=>{});
  const buf=c.createBuffer(1,1,22050);
  const src=c.createBufferSource();
  src.buffer=buf;src.connect(c.destination);src.start(0);
  return true;
 }catch{return false;}
}
function voice({frequency=120,end=frequency,at=0,duration=.3,volume=.2,type='sine',texture=false,pan=0,filter=1800,space=false}){
 const c=engine();if(activeVoices>=64)return;activeVoices++;
 const t=c.currentTime+at,source=texture?c.createBufferSource():c.createOscillator(),gain=c.createGain();
 let outputNode=gain,tone=null;
 if(c.createStereoPanner){try{const panner=c.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);outputNode=panner;}catch{}}
 if(texture){source.buffer=noise;tone=c.createBiquadFilter();tone.type='lowpass';tone.frequency.setValueAtTime(filter,t);tone.frequency.exponentialRampToValueAtTime(Math.max(80,filter*.2),t+duration);source.connect(tone);tone.connect(gain);}
 else{source.type=type;source.frequency.setValueAtTime(frequency,t);source.frequency.exponentialRampToValueAtTime(Math.max(18,end),t+duration);tone=c.createBiquadFilter();tone.type='lowpass';tone.frequency.setValueAtTime(filter,t);source.connect(tone);tone.connect(gain);}
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);outputNode.connect(master);if(space)outputNode.connect(room);if(texture)source.start(t,Math.random()*.15);else source.start(t);source.stop(t+duration+.02);
 source.onended=()=>{activeVoices=Math.max(0,activeVoices-1);source.disconnect();tone?.disconnect();gain.disconnect();if(outputNode!==gain)outputNode.disconnect();};
}
export function richSound(type,pan=0){
 try{
  const c=engine();recordings||=createRecordedSfx(c,master);recordings.warm();
  if(type==='start-button'){void recordings.playReady(type,pan);return;}
  if(type==='hero-shatter'){recordings.play(type,pan,.46);}
  else if(recordings.play(type,pan)){
   if(type==='attack-vampire')recordings.play('voice-vampire',pan);
   if(type==='attack-werewolf')recordings.play('voice-wolf',pan);
   return;
  }
  const now=performance.now();if(type==='select'&&now-lastSound<55)return;lastSound=now;
  if(['navigate','close','card','select'].includes(type)){
   const page=type==='card'||type==='select';
   voice({texture:true,duration:page?.19:.085,volume:page?.055:.04,filter:page?2300:4700,pan:-.12});
   voice({texture:true,at:.028,duration:page?.14:.06,volume:.035,filter:page?900:1700,pan:.12});
   voice({frequency:type==='close'?160:220,end:75,duration:.11,volume:.035,type:'triangle',filter:600});
   if(!page)voice({frequency:1320,end:1190,at:.018,duration:.13,volume:.018,type:'sine',space:true});
  }else if(type==='coins'){
   [0,.045,.11,.18,.28].forEach((at,i)=>{
    voice({texture:true,at,duration:.018,filter:7800,volume:.025,pan:(i-2)*.15});
    [1,1.47,2.09].forEach((ratio,j)=>voice({frequency:(1550+i*73)*ratio,end:(1540+i*73)*ratio,at,duration:.24+j*.08,volume:.037/(j+1),type:'sine',filter:8500,pan:(i-2)*.15,space:true}));
   });
   voice({frequency:125,end:54,at:.04,duration:.2,volume:.075,filter:700});
  }else if(type==='forge'||type==='repair'){
   const times=type==='forge'?[0,.19,.48]:[0,.14];
   times.forEach((at,i)=>{voice({texture:true,at,duration:.035,filter:7800,volume:.15,pan:(i-1)*.2});voice({frequency:145,end:43,at,duration:.24,volume:.16,filter:900});[631,1121,1733,2719].forEach((f,j)=>voice({frequency:f,end:f*.985,at:at+.012,duration:.3+j*.08,volume:.036/(j+1),type:'triangle',filter:6200,space:true,pan:(j-1.5)*.15}));});
   voice({texture:true,at:type==='forge'?.68:.3,duration:.5,filter:2600,volume:.065,space:true});
  }else if(type==='hero-shatter'){
   voice({frequency:48,end:180,duration:.48,volume:.13,type:'sawtooth',filter:480,space:true});
   voice({texture:true,duration:.48,filter:1500,volume:.09,space:true});
   voice({frequency:95,end:26,at:.46,duration:1.15,volume:.3,filter:400,space:true});
   voice({texture:true,at:.46,duration:.09,filter:7200,volume:.23});
   voice({texture:true,at:.48,duration:.9,filter:2200,volume:.17,space:true});
   [613,947,1429,2137,3181].forEach((frequency,i)=>voice({frequency,end:frequency*.38,at:.49+i*.045,duration:.6+i*.1,volume:.045,type:'triangle',filter:5000,space:true,pan:(i%2?1:-1)*.65}));
   [0,.12,.27,.43,.61].forEach((at,i)=>voice({texture:true,at:.65+at,duration:.15+i*.05,filter:4200-i*500,volume:.065-i*.007,space:true,pan:(i%2?1:-1)*.8}));
   voice({frequency:39,end:28,at:.7,duration:1.2,volume:.13,space:true});
  }else if(['moon','court','grave','steel','flame','blood','claw'].includes(type)){
   const tone={moon:392,court:294,grave:58,steel:860,flame:120,blood:84,claw:155}[type];
   voice({frequency:tone,end:tone*(type==='moon'||type==='court'?1.5:.35),duration:.48,volume:.11,type:type==='steel'?'triangle':'sine',space:true,pan});
   voice({texture:true,duration:.32,filter:type==='steel'?6200:type==='flame'?3400:900,volume:.09,pan});
   if(type==='court'||type==='moon')voice({frequency:tone*1.5,end:tone*2,at:.09,duration:.5,volume:.05,space:true,pan});
  }else if(['attack','clash','damage','death'].includes(type)){
   const variation=.94+Math.random()*.12,heavy=type==='death'||type==='clash';
   // Separate transient, body, fracture and room tail instead of one impact tone.
   if(type==='attack'){
    [0,.025,.06].forEach((at,i)=>voice({texture:true,at,duration:.1+i*.045,volume:.06+i*.025,filter:1800+i*1900,pan:pan+(i-1)*.22}));
    voice({frequency:260*variation,end:52,duration:.18,volume:.085,type:'triangle',filter:700,pan});
   }else{
    voice({texture:true,duration:.045,volume:.19,filter:7500,pan});
    voice({frequency:heavy?76:115*variation,end:heavy?24:39,duration:heavy?.55:.27,volume:.24,filter:500,pan});
    [0,.019,.049].forEach((at,i)=>voice({texture:true,at,duration:.065+i*.027,filter:2600-i*480,volume:.115-i*.022,pan:pan+(i-1)*.14}));
    voice({texture:true,at:.07,duration:heavy?.7:.26,filter:heavy?1200:650,volume:.075,space:true,pan});
    if(type==='clash')[713,1149,1837].forEach((frequency,i)=>voice({frequency:frequency*variation,end:frequency*.91,at:.035+i*.008,duration:.24+i*.1,volume:.033,type:'triangle',filter:5200,space:true,pan:(i-1)*.3}));
    if(type==='death'){voice({texture:true,at:.09,duration:.4,volume:.13,filter:4300,pan:-.25});voice({frequency:49,end:22,at:.13,duration:.8,volume:.12,space:true,pan:.2});}
   }
  }else if(type==='drain'){
   voice({texture:true,duration:.72,filter:1650,volume:.22,pan,space:true});voice({frequency:92,end:24,duration:.78,volume:.3,type:'sawtooth',filter:620,pan,space:true});voice({frequency:230,end:64,at:.09,duration:.58,volume:.16,type:'triangle',pan,space:true});
   [0,.14,.28,.42].forEach((at,i)=>voice({texture:true,at,duration:.32,filter:1100-i*150,volume:.12-i*.012,pan:pan+(i%2?.13:-.13)}));
   [0,.13,.27].forEach((at,i)=>voice({frequency:440+i*90,end:780+i*120,at,duration:.38,volume:.055,type:'sine',pan:pan+(i-1)*.2,space:true}));
  }else if(type==='heal'){
   voice({texture:true,duration:.55,filter:700,volume:.12,pan,space:true});[0,.09,.18].forEach((at,i)=>voice({frequency:170+i*110,end:570+i*140,at,duration:.42,volume:.075,type:'sine',pan:pan+(i-1)*.15,space:true}));
  }else if(['ultimate','curse','defeat'].includes(type)){
   voice({frequency:64,end:25,duration:.9,volume:.35,space:true});voice({texture:true,duration:.75,filter:2500,volume:.2});[0,.05,.1].forEach((at,i)=>voice({frequency:120+i*17,end:55,at,duration:.65,volume:.07,type:'sawtooth',space:true}));
  }else if(['loot','level','victory','synergy'].includes(type)){
   [392,493.88,587.33,783.99].forEach((frequency,i)=>voice({frequency,end:frequency*.997,at:i*.07,duration:.5,volume:.085,type:'sine',space:true}));
  }else if(type==='equip'){
   [0,.035,.09].forEach((at,i)=>voice({texture:true,at,duration:.035,filter:7000-i*1000,volume:.09,pan}));
   [830,1327,2150].forEach((frequency,i)=>voice({frequency,end:frequency*.98,at:.04,duration:.19+i*.09,volume:.032,type:'triangle',filter:6000,space:true,pan}));
   voice({frequency:155,end:58,duration:.16,volume:.13,pan});
  }else if(type==='summon'||type==='start'){
   voice({texture:true,duration:.24,filter:3500,volume:.13});voice({frequency:90,end:210,duration:.38,volume:.18,space:true});voice({frequency:630,end:420,at:.06,duration:.32,volume:.055,type:'triangle'});
  }else voice({frequency:620,end:380,duration:.095,volume:.085,type:'triangle'});
 }catch{/* Sound is optional; gameplay never depends on audio support. */}
}
