import {tearCombatant} from '/visceral.js';
import { animateEvents,captureCombatFrame,playSound } from '/effects.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function playCombatSequence({before,after,events,frame,render,cardHTML,speed=1}){
  if(!events.length){render(after);return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible=structuredClone(before),pendingFlight=frame;
  const dead=new Set();
  // Only public board deltas are replayed. Private draws arrive with the authoritative final view.
  const apply=e=>{
    const delta=e.visual;
    if(delta){for(const key of ['round','turn'])if(delta[key]!==undefined)visible[key]=delta[key];delta.players.forEach((patch,i)=>Object.assign(visible.players[i],structuredClone(patch)));}
    if(e.type==='play'&&visible.players[e.seat].hand)visible.players[e.seat].hand=visible.players[e.seat].hand.filter(c=>c.uid!==e.source);
    if(e.type==='death')dead.add(e.target);
    for(const p of visible.players)for(const lane of Object.keys(p.lanes))p.lanes[lane]=p.lanes[lane].filter(u=>!dead.has(u.uid));
    visible.phase='playing';visible.winner=null;
    render(visible,e);
  };
  for(const e of events){
    if(e.type==='play'){
      if(e.seat===before.seat)pendingFlight=captureCombatFrame({type:'play',uid:e.source})||pendingFlight;
      const arena=document.querySelector('.arena'),preview=document.createElement('div');preview.className='cinematic-play-card';preview.innerHTML=cardHTML(e.cardId);arena?.append(preview);playSound('summon');
      if(!reduced&&arena){await preview.animate([{opacity:0,transform:'translate(-50%,-30%) scale(.5) rotateY(-28deg)'},{opacity:1,transform:'translate(-50%,-50%) scale(1) rotateY(0deg)',offset:.55},{opacity:0,transform:'translate(-50%,-65%) scale(.76)'}],{duration:620/speed,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.catch(()=>{});}preview.remove();
      apply(e);continue;
    }
    if(['summon','equip','round','synergy','claim','level','loot','settled'].includes(e.type))apply(e);
    const currentFrame=e.type==='attack'?captureCombatFrame({type:'attack',uid:e.source}):pendingFlight;
    if(e.type!=='settled'&&e.type!=='item-lost')await animateEvents([e],before.seat,currentFrame,{speed});
    if(pendingFlight&&['summon','equip','skill','damage','heal','claim','loot'].includes(e.type))pendingFlight=null;
    if(e.type==='death'){
      const target=[...document.querySelectorAll('[data-unit]')].find(node=>node.dataset.unit===e.target);
      if(target&&!reduced)await tearCombatant(target,speed);
    }
    if(!['summon','equip','round','synergy','claim','level','loot','settled'].includes(e.type))apply(e);
    if(!reduced&&e.type==='settled')await wait(110/speed);
  }
  render(after);playSound(after.phase==='finished'?(after.winner===after.seat?'victory':'defeat'):'select');
}
