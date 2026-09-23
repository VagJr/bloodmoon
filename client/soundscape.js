let context,master,noise,room,compressor;
let lastSound=0;
function engine(){
 if(context){if(context.state==='suspended')context.resume().catch(()=>{});return context;}
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)throw new Error('Web Audio indisponível');
 context=new AudioContextClass();if(context.state==='suspended')context.resume().catch(()=>{});master=context.createGain();master.gain.value=.42;
 compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;master.connect(compressor);compressor.connect(context.destination);
 const length=context.sampleRate;noise=context.createBuffer(1,length,context.sampleRate);const channel=noise.getChannelData(0);for(let i=0;i<length;i++)channel[i]=Math.random()*2-1;
 room=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(length*.65),context.sampleRate);for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.16;}room.buffer=impulse;room.connect(master);return context;
}
export function unlockSoundscape(){
 try{
  const c=engine();
  if(c.state==='suspended')c.resume().catch(()=>{});
  const buf=c.createBuffer(1,1,22050);
  const src=c.createBufferSource();
  src.buffer=buf;src.connect(c.destination);src.start(0);
  return true;
 }catch{return false;}
}
function voice({frequency=120,end=frequency,at=0,duration=.3,volume=.2,type='sine',texture=false,pan=0,filter=1800,space=false}){
 const c=engine(),t=c.currentTime+at,source=texture?c.createBufferSource():c.createOscillator(),gain=c.createGain();
 let outputNode=gain;
 if(c.createStereoPanner){try{const panner=c.createStereoPanner();panner.pan.value=pan;gain.connect(panner);outputNode=panner;}catch{}}
 if(texture){source.buffer=noise;const tone=c.createBiquadFilter();tone.type='lowpass';tone.frequency.setValueAtTime(filter,t);tone.frequency.exponentialRampToValueAtTime(Math.max(80,filter*.2),t+duration);source.connect(tone);tone.connect(gain);}
 else{source.type=type;source.frequency.setValueAtTime(frequency,t);source.frequency.exponentialRampToValueAtTime(Math.max(18,end),t+duration);source.connect(gain);}
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);outputNode.connect(master);if(space)outputNode.connect(room);source.start(t);source.stop(t+duration+.02);
 source.onended=()=>{source.disconnect();gain.disconnect();if(outputNode!==gain)outputNode.disconnect();};
}
export function richSound(type,pan=0){
 try{
  const now=performance.now();if(type==='select'&&now-lastSound<55)return;lastSound=now;
  if(['attack','clash','damage','death'].includes(type)){
   voice({texture:true,duration:type==='attack'?.2:.32,volume:.23,filter:type==='attack'?4600:1800,pan});
   voice({frequency:type==='death'?72:130,end:28,duration:.28,volume:.32,pan,space:true});
   if(type==='clash'){voice({frequency:850,end:180,at:.06,duration:.55,volume:.11,type:'triangle',space:true});voice({texture:true,at:.06,duration:.6,filter:5000,volume:.15});}
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
  }else if(type==='summon'||type==='equip'||type==='start'){
   voice({texture:true,duration:.24,filter:3500,volume:.13});voice({frequency:90,end:210,duration:.38,volume:.18,space:true});voice({frequency:630,end:420,at:.06,duration:.32,volume:.055,type:'triangle'});
  }else voice({frequency:620,end:380,duration:.095,volume:.085,type:'triangle'});
 }catch{/* Sound is optional; gameplay never depends on audio support. */}
}
