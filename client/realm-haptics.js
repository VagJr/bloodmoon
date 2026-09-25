// The web vibration API controls pulse duration, not motor amplitude. Distinct
// rhythms and on-times provide weight without asking the motor to run nonstop.
const KEY='bloodmoon.realm.haptics';
const PATTERNS=Object.freeze({
  test:{pulse:[70,45,95],priority:7,gap:0},
  cast:{pulse:[28],priority:0,gap:110},
  hit:{pulse:[38],priority:1,gap:130},
  magic:{pulse:[32,28,57],priority:2,gap:180},
  heavy:{pulse:[62,26,40],priority:3,gap:190},
  thunder:{pulse:[48,35,90,24,45],priority:5,gap:300},
  critical:{pulse:[55,25,78],priority:5,gap:240},
  'enemy-hit':{pulse:[66,26,35],priority:5,gap:210},
  'enemy-heavy':{pulse:[95,32,65],priority:6,gap:270},
  block:{pulse:[50,35,31],priority:4,gap:180},
  parry:{pulse:[28,35,85],priority:6,gap:240},
  reflect:{pulse:[34,25,35,30,82],priority:6,gap:250},
  'guard-break':{pulse:[105,38,65],priority:7,gap:330},
  interrupt:{pulse:[44,38,25],priority:3,gap:200},
  dash:{pulse:[32,22,28],priority:2,gap:170},
  evade:{pulse:[28,25,28],priority:2,gap:170},
  guard:{pulse:[45,30,28],priority:2,gap:200},
  heal:{pulse:[30,42,55],priority:2,gap:240},
  knockback:{pulse:[78,28,52],priority:5,gap:230},
  collision:{pulse:[65],priority:3,gap:180},
  impact:{pulse:[48,28,40],priority:3,gap:170}
});

export function createRealmHaptics({navigator:nav,document:doc,storage,clock=()=>Date.now(),reducedMotion=()=>false}={}){
  let saved;try{saved=storage?.getItem(KEY);}catch{}
  let mode=['off','soft','full'].includes(saved)?saved:'full';
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
    if(!event||!playerId||!armed||mode==='off'||!supported()||doc?.hidden)return false;
    if(event.source!==playerId&&event.targetId!==playerId&&event.owner!==playerId)return false;
    if(Number.isFinite(event.at)&&(now-event.at>2500||event.at-now>1000))return false;
    if(event.id&&seen.has(event.id))return false;
    if(event.id){seen.add(event.id);if(seen.size>128)seen.delete(seen.values().next().value);}
    const key=event.kind==='enemy-hit'&&event.amount>=16?'enemy-heavy':
      ['hit','impact','critical'].includes(event.kind)&&['tempest','moonfire','enemy-storm'].includes(event.ability)?'thunder':
      event.kind==='hit'&&['cleave','execution','rend','pounce'].includes(event.ability)?'heavy':
      event.kind==='hit'&&event.damageType==='magic'?'magic':event.kind;
    const pattern=PATTERNS[key];if(!pattern)return false;
    const time=clock();
    // Strong defensive signals can interrupt a light attack, but repeated hits
    // never restart an ongoing pattern or keep the motor continuously engaged.
    if(time-lastAt<70&&pattern.priority<=priority||time<busyUntil&&pattern.priority<=priority||time-lastAt<pattern.gap&&pattern.priority<=priority)return false;
    const factor=mode==='soft'?.62:1;
    const pulse=pattern.pulse.map((duration,index)=>index%2?duration:Math.max(20,Math.round(duration*factor*(reducedMotion()?.8:1))));
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
