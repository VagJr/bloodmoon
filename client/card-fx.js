import {CARDS} from '/shared/cards.js';
const palette={blood:'#f34666',moon:'#a9e1f4',grave:'#9bbe92',court:'#e7c27f',steel:'#e2d7c1',flame:'#ff9b51',claw:'#d36762'};
export function cardSignature(id){
 const c=CARDS[id]||{},words=[c.name,c.effect,c.keyword,c.gearEffect,...(c.tags||[])].join(' ').toLowerCase();
 const style=/chama|fogo|brasa|fire/.test(words)?'flame':/lâmina|blade|duel|execu|espada|perfur/.test(words)?'steel':/court|influence|corte|pacto|voto/.test(words)?'court':/grave|osso|sepul|tumular|guard/.test(words)?'grave':/moon|lua|geada|lunar/.test(words)?'moon':/blood|drain|lifesteal|sang|dízimo/.test(words)?'blood':c.faction==='werewolf'?'claw':'court';
 const seed=Array.from(id||'').reduce((n,x)=>(n*31+x.charCodeAt(0))>>>0,7);
 return {style,color:palette[style],seed};
}
export function cardEffect(root,point,id,phase='impact'){
 if(!root||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const {style,color,seed}=cardSignature(id),ns='http://www.w3.org/2000/svg';
 const el=document.createElementNS(ns,'svg');el.classList.add('card-signature-fx',`signature-${style}`,`signature-${phase}`);el.setAttribute('viewBox','-100 -100 200 200');el.setAttribute('aria-hidden','true');el.style.left=point.x+'px';el.style.top=point.y+'px';el.style.setProperty('--signature-color',color);
 const path=(d,width=1.4)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke','currentColor');p.setAttribute('stroke-width',width);p.setAttribute('stroke-linecap','round');el.append(p);return p;};
 const count=phase==='summon'?9:6;
 for(let i=0;i<count;i++){
  const angle=(i/count*360+seed%75)*Math.PI/180,r=38+(seed+i*13)%36,x=Math.cos(angle)*r,y=Math.sin(angle)*r;
  if(style==='steel'||style==='claw')path(`M ${x-42} ${y-45} Q ${x+5} ${y} ${x+35} ${y+40}`,style==='steel'?1.4:2.1);
  else if(style==='blood')path(`M ${x} ${y} C ${-y} ${x} ${y*.6} ${-x*.6} 0 0`,.8+i%3*.4);
  else if(style==='moon')path(`M ${x} ${y} Q ${-y*1.4} ${x*1.4} ${-x} ${-y}`,1.1);
  else if(style==='flame')path(`M ${x*.7} 45 Q ${x-18} ${y-36} ${x*.3} -${r}`,2);
  else if(style==='grave')path(`M 0 0 L ${x*.5} ${y*.4} L ${x*.7-9} ${y*.7} L ${x} ${y}`,1.6);
  else path(`M ${x} ${y-8} L ${x+6} ${y} L ${x} ${y+8} L ${x-6} ${y} Z`,1);
 }
 if(phase==='summon'||style==='court'||style==='grave')for(const r of [36,54,78]){const ring=document.createElementNS(ns,'circle');ring.setAttribute('r',r);ring.setAttribute('fill','none');ring.setAttribute('stroke','currentColor');ring.setAttribute('stroke-width','.7');ring.setAttribute('stroke-dasharray',`${r/3} ${r/9}`);el.append(ring);}
 root.append(el);
 const children=[...el.children];for(let i=0;i<children.length;i++){const p=children[i],length=p.getTotalLength();p.style.strokeDasharray=length;p.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:length*.2,opacity:1,offset:.3},{strokeDashoffset:0,opacity:0}],{duration:phase==='summon'?560:420,delay:i*14,fill:'both',easing:'ease-out'});}
 el.animate([{transform:`translate(-50%,-50%) scale(.55) rotate(${seed%40-20}deg)`},{transform:`translate(-50%,-50%) scale(1.1) rotate(${seed%40+12}deg)`}],{duration:730,fill:'forwards',easing:'ease-out'});
 setTimeout(()=>el.remove(),1100);
}
