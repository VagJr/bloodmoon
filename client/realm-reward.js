import {CARDS} from '/shared/cards.js';
const LABELS={coins:['◈','MARCAS'],dust:['✧','FRAGMENTOS'],scrap:['⚒','SUCATA'],provisions:['◉','PROVISÕES'],timber:['♧','MADEIRA'],ore:['⬡','MINÉRIO'],essence:['✧','ESSÊNCIA'],xp:['✦','EXPERIÊNCIA']};
const TITLES={gather:'COLETA CONCLUÍDA','table-harvest':'RESERVA RECOLHIDA',travel:'NOVA REGIÃO DESCOBERTA',retreat:'REGRESSO AO PORTO','forge-gear':'RELÍQUIA FORJADA',chapter:'CAPÍTULO SELADO','daily-claim':'COMISSÃO CONCLUÍDA','table-deploy':'DESTACAMENTO PREPARADO','table-influence':'INFLUÊNCIA EXERCIDA','table-siege':'CERCO RESOLVIDO','table-raid':'GOLPE NO GUARDIÃO','table-raid-claim':'TESOURO DA VIGÍLIA'};
let host=null,timer=0;
export function showRealmReward({type,changes=[],cards=[],detail=''}){
 if(!host){host=document.createElement('aside');host.className='realm-reward-feed';host.setAttribute('aria-live','polite');host.setAttribute('aria-label','Recompensas dos Reinos');document.body.append(host);}
 const title=TITLES[type]||'ORDEM CONCLUÍDA';
 host.innerHTML=`<article class="realm-reward-toast"><i class="realm-reward-sigil">${type==='travel'?'⌖':type.includes('raid')?'☠':type.includes('influence')?'♜':type.includes('forge')?'⚒':'✦'}</i><div class="realm-reward-copy"><small>${title}</small>${detail?`<b>${detail}</b>`:''}<div class="realm-reward-gains">${changes.map(x=>`<span class="${x.amount<0?'cost':''}"><i>${x.icon}</i><b>${x.amount>0?'+':''}${x.amount}</b><small>${x.label}</small></span>`).join('')}${cards.map(c=>`<span class="realm-loot-card"><img src="${c.art}" alt=""><b>+1</b><small>${c.name}</small></span>`).join('')}</div></div></article>`;
 host.classList.remove('show');void host.offsetWidth;host.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>host?.classList.remove('show'),3900);
}
export function realmRewardDiff(before,after,type){
 const a=before?.player||{},b=after?.player||{},pa=before?.profile||{},pb=after?.profile||{},changes=[];
 const add=(label,icon,oldValue,newValue)=>{const amount=(Number(newValue)||0)-(Number(oldValue)||0);if(amount)changes.push({label,icon,amount});};
 add('Marcas','◈',pa.coins,pb.coins);add('Fragmentos','✧',pa.dust,pb.dust);add('Sucata','⚒',pa.scrap,pb.scrap);add('Provisões','◉',a.provisions,b.provisions);add('Experiência','✦',a.xp,b.xp);
 for(const key of ['timber','ore','essence'])add(LABELS[key][1],LABELS[key][0],a.materials?.[key],b.materials?.[key]);
 const prior=new Set((pa.items||[]).map(i=>i.id)),cards=(pb.items||[]).filter(i=>!prior.has(i.id)).map(i=>({name:CARDS[i.cardId]?.name||i.cardId,art:`/assets/cards/${i.cardId}.png`}));
 const region=after?.regions?.find(n=>n.id===b.location);return {type,changes,cards,detail:type==='travel'?region?.name:type==='gather'?region?.name:''};
}
