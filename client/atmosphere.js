const MIXES={
 realm:[
  [{src:'/assets/ambience/cold-snowfall.mp3',gain:.12,rate:[.985,1.015]},{src:'/assets/ambience/temple-room.mp3',gain:.035,rate:[.94,1.03]},{src:'/assets/ambience/haunted-whispers.mp3',gain:.018,rate:[.97,1.02]}],
  [{src:'/assets/ambience/haunted-house.mp3',gain:.105,rate:[.985,1.015]},{src:'/assets/ambience/winter-storm.mp3',gain:.04,rate:[.97,1.02]},{src:'/assets/ambience/temple-room.mp3',gain:.025,rate:[.94,1.03]}],
  [{src:'/assets/ambience/winter-storm.mp3',gain:.105,rate:[.97,1.03]},{src:'/assets/ambience/february-storm.mp3',gain:.035,rate:[.94,1.04]},{src:'/assets/ambience/rainstorm.mp3',gain:.025,rate:[.96,1.04]},{src:'/assets/ambience/temple-room.mp3',gain:.024,rate:[.95,1.03]}],
  [{src:'/assets/ambience/cold-snowfall.mp3',gain:.105,rate:[.99,1.01]},{src:'/assets/ambience/haunted-house.mp3',gain:.052,rate:[.99,1.01]},{src:'/assets/ambience/haunted-whispers.mp3',gain:.03,rate:[.96,1.02]}]
 ],
 arena:[
  [{src:'/assets/ambience/rainstorm.mp3',gain:.075,rate:[.96,1.04]},{src:'/assets/ambience/haunted-whispers.mp3',gain:.025,rate:[.94,1.02]}],
  [{src:'/assets/ambience/february-storm.mp3',gain:.075,rate:[.95,1.04]},{src:'/assets/ambience/haunted-whispers.mp3',gain:.03,rate:[.93,1.03]}]
 ]
};
const THUNDER=['/assets/ambience/thunder-crack.mp3','/assets/ambience/deep-boom.mp3','/assets/ambience/storm-crash.mp3'];
let scene='quiet',muted=false,weatherTimer=0,mixTimer=0,serial=0,thunderIndex=0,layers=[],flashTimer=0;
const random=(min,max)=>min+Math.random()*(max-min);
function fade(layer,target,duration,stop=false){
 clearInterval(layer.fadeTimer);const start=layer.audio.volume,at=performance.now();
 layer.fadeTimer=setInterval(()=>{const t=Math.min(1,(performance.now()-at)/duration);layer.audio.volume=Math.max(0,Math.min(1,start+(target-start)*t));if(t>=1){clearInterval(layer.fadeTimer);if(stop){layer.audio.pause();layer.audio.removeAttribute('src');layer.audio.load();}}},90);
}
function startMix(next){
 const version=++serial;
 for(const layer of layers)fade(layer,0,1800,true);
 layers=[];if(!next||muted)return;
 const options=MIXES[next];if(!options)return;
 const mix=options[Math.floor(Math.random()*options.length)];
 for(const track of mix){const audio=new Audio(track.src);audio.loop=true;audio.preload='none';audio.playsInline=true;audio.playbackRate=random(...track.rate);audio.volume=0;const layer={audio,gain:track.gain};layers.push(layer);audio.play().then(()=>{if(version===serial&&!muted)fade(layer,layer.gain,4200);}).catch(()=>{});}
}
function sceneHost(){return scene==='arena'?document.querySelector('.arena'):scene==='realm'?document.querySelector('.rw-viewport'):null;}
function flashScene(){
 const host=sceneHost();if(!host)return;
 host.style.setProperty('--storm-x',`${Math.round(random(22,78))}%`);host.style.setProperty('--storm-y',`${Math.round(random(16,56))}%`);
 host.classList.remove('bm-storm-flash');void host.offsetWidth;host.classList.add('bm-storm-flash');
 clearTimeout(flashTimer);flashTimer=setTimeout(()=>host.classList.remove('bm-storm-flash'),620);
}
function playThunder(){
 if(muted||!scene||scene==='quiet')return;
 const src=THUNDER[thunderIndex++%THUNDER.length],audio=new Audio(src);audio.preload='auto';audio.volume=random(.15,.24);audio.playbackRate=random(.88,1.1);audio.addEventListener('ended',()=>audio.remove(),{once:true});audio.play().catch(()=>audio.remove());
 if(Math.random()<.28){const delay=random(180,420);setTimeout(()=>{if(muted||scene==='quiet')return;const tail=new Audio('/assets/ambience/deep-boom.mp3');tail.volume=random(.08,.14);tail.playbackRate=random(.78,.96);tail.addEventListener('ended',()=>tail.remove(),{once:true});tail.play().catch(()=>tail.remove());},delay);}
}
function scheduleWeather(first=false){clearTimeout(weatherTimer);if(muted||scene==='quiet')return;const activeScene=scene;weatherTimer=setTimeout(()=>{if(scene!==activeScene||muted)return;flashScene();const delay=random(220,1150);setTimeout(()=>{if(scene===activeScene&&!muted)playThunder();},delay);scheduleWeather();},first?random(6500,13500):random(activeScene==='arena'?19000:28000,activeScene==='arena'?39000:52000));}
function scheduleMixVariation(){clearTimeout(mixTimer);if(muted||scene==='quiet')return;const activeScene=scene;mixTimer=setTimeout(()=>{if(scene!==activeScene||muted)return;startMix(activeScene);scheduleMixVariation();},random(95000,165000));}
export function setAtmosphereScene(next){
 if(!MIXES[next])next='quiet';if(scene===next)return;scene=next;startMix(next);scheduleWeather(true);scheduleMixVariation();
}
export function setAtmosphereMuted(value){muted=Boolean(value);if(muted){clearTimeout(weatherTimer);clearTimeout(mixTimer);for(const layer of layers)fade(layer,0,120,true);}else{startMix(scene);scheduleWeather(true);scheduleMixVariation();}}
export function unlockAtmosphere(){if(muted)return;for(const layer of layers)if(layer.audio.paused)layer.audio.play().then(()=>fade(layer,layer.gain,2200)).catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(weatherTimer);for(const layer of layers)layer.audio.pause();}else unlockAtmosphere();});
