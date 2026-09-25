// Combat-only tactile feedback. The web vibration API controls pulse duration,
// not motor amplitude; intensity therefore scales the on-time of each pulse.
const KEY='bloodmoon.realm.haptics';
const PATTERNS=Object.freeze({
  cast:{pulse:[7],priority:0,gap:220},
  hit:{pulse:[15],priority:1,gap:150},
  heavy:{pulse:[24,22,12],priority:2,gap:190},
  critical:{pulse:[18,25,42],priority:3,gap:240},
  'enemy-hit':{pulse:[38,28,18],priority:4,gap:240},
  block:{pulse:[11,20,11],priority:3,gap:180},
  parry:{pulse:[9,22,9,28,30],priority:5,gap:260},
  reflect:{pulse:[8,18,16,24,32],priority:5,gap:260},
  'guard-break':{pulse:[48,28,18,25,42],priority:6,gap:360},
  interrupt:{pulse:[25,30,9],priority:3,gap:220},
  dash:{pulse:[8,18,5],priority:1,gap:180},
  evade:{pulse:[6,26,6],priority:2,gap:180},
  guard:{pulse:[14,24,7],priority:1,gap:200},
  heal:{pulse:[7,38,12],priority:1,gap:250},
  collision:{pulse:[10],priority:1,gap:180}
});

export function createRealmHaptics({navigator:nav,document:doc,storage,clock=()=>Date.now(),reducedMotion=()=>false}={}){
  let saved;try{saved=storage?.getItem(KEY);}catch{}
  let mode=['off','soft','full'].includes(saved)?saved:'soft';
  let armed=false,lastAt=-Infinity,busyUntil=0,priority=-1,unlisten=null;
  const seen=new Set();
  const supported=()=>typeof nav?.vibrate==='function';
  const stop=()=>{try{if(supported())nav.vibrate(0);}catch{}busyUntil=0;priority=-1;};
  const cancel=()=>{if(armed)stop();armed=false;lastAt=-Infinity;seen.clear();unlisten?.();unlisten=null;};
  const prime=()=>{
    if(!supported())return false;
    armed=true;
    if(!unlisten&&doc?.addEventListener){
      const hide=()=>{if(doc.hidden)stop();};
      doc.addEventListener('visibilitychange',hide);
      unlisten=()=>doc.removeEventListener('visibilitychange',hide);
    }
    return true;
  };
  const setMode=value=>{
    if(!['off','soft','full'].includes(value))return mode;
    mode=value;try{storage?.setItem(KEY,mode);}catch{}
    if(mode==='off')stop();
    return mode;
  };
  const trigger=(event,{playerId,now=clock()}={})=>{
    if(!event||!playerId||!armed||mode==='off'||!supported()||doc?.hidden||nav.userActivation?.hasBeenActive===false)return false;
    if(event.source!==playerId&&event.targetId!==playerId&&event.owner!==playerId)return false;
    if(Number.isFinite(event.at)&&(now-event.at>1000||event.at-now>1000))return false;
    if(event.id&&seen.has(event.id))return false;
    if(event.id){seen.add(event.id);if(seen.size>128)seen.delete(seen.values().next().value);}
    const key=event.kind==='hit'&&['cleave','tempest','execution'].includes(event.ability)?'heavy':event.kind;
    const pattern=PATTERNS[key];if(!pattern)return false;
    const time=clock();
    // Strong defensive signals can interrupt a light attack, but repeated hits
    // never restart an ongoing pattern or keep the motor continuously engaged.
    if(time-lastAt<70||time<busyUntil&&pattern.priority<=priority||time-lastAt<pattern.gap&&pattern.priority<=priority)return false;
    const factor=mode==='soft'?.55:1;
    const pulse=pattern.pulse.map((duration,index)=>index%2?duration:Math.max(3,Math.round(duration*factor*(reducedMotion()?.75:1))));
    try{
      if(nav.vibrate(pulse)===false)return false;
    }catch{return false;}
    lastAt=time;busyUntil=time+pulse.reduce((a,b)=>a+b,0);priority=pattern.priority;
    return true;
  };
  return {trigger,prime,cancel,setMode,getMode:()=>mode,supported};
}

let storage;try{storage=globalThis.localStorage;}catch{}
const haptics=createRealmHaptics({navigator:globalThis.navigator,document:globalThis.document,storage,reducedMotion:()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false});
export const triggerRealmHaptic=(event,options)=>haptics.trigger(event,options);
export const primeRealmHaptics=()=>haptics.prime();
export const cancelRealmHaptics=()=>haptics.cancel();
export const setRealmHaptics=mode=>haptics.setMode(mode);
export const getRealmHaptics=()=>haptics.getMode();
export const supportsRealmHaptics=()=>haptics.supported();
