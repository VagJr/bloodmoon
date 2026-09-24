import {FEATURES,JOURNEY_LESSONS,featureOpen,featureRequirement,isJourneyAccount,journeyAct,lessonFeature} from '/shared/player-journey.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installPlayerJourney(getState,save){
 const coach=document.createElement('aside');coach.className='journey-coach';coach.hidden=true;coach.setAttribute('aria-label','Orientação contextual de Iria');
 const map=document.createElement('dialog');map.className='journey-map';map.setAttribute('aria-label','Jornada e desbloqueios');document.body.append(coach,map);
 let lessonId=null,step=0,saving=false,highlight=null,lastContext=null,frame=0,lastAccount=null,lastMatches=0;const paused=new Set();
 function unhighlight(){highlight?.classList.remove('journey-focus');highlight=null;}
 function hide(){coach.hidden=true;lessonId=null;unhighlight();}
 function drawCoach(){
  const lesson=JOURNEY_LESSONS[lessonId];if(!lesson)return;
  const [title,text,selector]=lesson.steps[step]||lesson.steps[0];unhighlight();
  highlight=document.querySelector(selector);highlight?.classList.add('journey-focus');coach.classList.toggle('at-top',!!highlight&&highlight.getBoundingClientRect().top>innerHeight*.55);
  coach.hidden=false;coach.innerHTML=`<img src="/assets/avatars/oracle.png" alt="Iria"><div><small>IRIA · ${esc(lesson.name)} · ${step+1}/${lesson.steps.length}</small><h3>${esc(title)}</h3><p>${esc(text)}</p><nav>${lessonId==='welcome'?'<button data-academy-start>⚔ TREINAR NA MESA</button>':lessonId==='dungeon'?'<button data-start="dungeon" data-journey-proceed>⚔ EMBARCAR</button>':''}<button data-journey-back ${!step||saving?'disabled':''}>←</button><button data-journey-next ${saving?'disabled':''}>${saving?'SALVANDO…':step===lesson.steps.length-1?'ENTENDI · CONCLUIR':'CONTINUAR →'}</button><button data-journey-pause ${saving?'disabled':''}>DEPOIS</button></nav><span class="journey-save-error" role="status"></span></div>`;
 }
 function begin(id,fromStart=false){const p=getState().profile;if(!JOURNEY_LESSONS[id]||!featureOpen(p,lessonFeature(id)))return;lessonId=id;step=fromStart?0:Math.min(JOURNEY_LESSONS[id].steps.length-1,p.journey?.lessons?.[id]?.step||0);drawCoach();}
 function openMap(feature){
  const p=getState().profile;if(!p)return;const act=journeyAct(p);
  map.innerHTML=`<header><small>CRÔNICAS DE VÉSPERA</small><button data-journey-close aria-label="Fechar jornada">×</button><h2>${act.title}</h2><p>${esc(feature?featureRequirement(p,feature):act.goal)}</p></header><div class="journey-path">${Object.entries(FEATURES).map(([id,f])=>`<article class="${featureOpen(p,id)?'open':'locked'}"><i>${f.icon}</i><div><b>${f.name}</b><small>${featureOpen(p,id)?'DISPONÍVEL':f.at+' BATALHAS CONCLUÍDAS'}</small></div><span>${featureOpen(p,id)?'✓':'◇'}</span></article>`).join('')}</div><h3>Guias para cada descoberta</h3><button data-journey-training>⚔ TREINO PRÁTICO · ${p.journey?.lessons?.combat?.complete?'CONCLUÍDO · REVER':(p.journey?.lessons?.combat?.step||0)+'/9 EXERCÍCIOS'}</button><div class="journey-lessons">${Object.entries(JOURNEY_LESSONS).map(([id,l])=>`<button data-journey-replay="${id}" ${!featureOpen(p,lessonFeature(id))?'disabled':''}>${p.journey?.lessons?.[id]?.complete?'✓':'✧'} ${l.name}<small>${p.journey?.lessons?.[id]?.complete?'REVER':'APRENDER'}</small></button>`).join('')}</div><footer>Vitórias e derrotas liberam sistemas. Desistências não contam. O treino é gratuito e não desgasta itens.</footer>`;
  if(!map.open)map.showModal();hide();
 }
 function featureOf(b){
  const d=b.dataset;if(d.faction&&d.faction!==getState().profile?.starterFaction)return 'lineage';
  if(d.tradeZone)return ({vault:'vault',market:'market',orders:'market',forge:'forge'})[d.tradeZone];
  if(d.craft)return 'forge';if(d.marketList||d.marketBuy||d.orderCreate||d.orderFill)return 'market';
  if(d.tableAction==='siege'||d.tableAction==='influence')return 'politics';if(d.bankAction)return 'vault';if(d.realmJoin||d.realmPolicy||d.realmWar||b.hasAttribute('data-realm-donate')||['politics','house','war'].includes(d.realmTab))return 'politics';
  if(b.hasAttribute('data-open-realms'))return 'realms';if(d.start==='dungeon')return 'dungeon';
  if(b.hasAttribute('data-buy-booster'))return 'boosters';
  if(d.modal)return ({decks:'decks',boosters:'boosters',contracts:'contracts',duel:'duel'})[d.modal];
  if(d.deckEdit||d.deckNew||d.deckActivate||b.hasAttribute('data-deck-save'))return 'decks';
 }
 function context(){const s=getState();if(!s.profile||s.profile.onboardingComplete===false||s.room||s.busy)return null;if(s.modal==='academy'||(!s.modal&&!s.worldOpen&&isJourneyAccount(s.profile)&&!(s.profile.matches>0)))return 'welcome';if(s.modal==='market')return document.querySelector('.trading-hall')?.className.match(/zone-(\w+)/)?.[1]||'inventory';if(s.worldOpen&&!s.modal)return s.realmTab==='house'?'politics':s.realmTab==='camp'?'camp':s.realmTab==='journey'?'chronicle':'realms';return JOURNEY_LESSONS[s.modal]?s.modal:null;}
 function decorate(){
  frame=0;const s=getState(),p=s.profile;if(!p||p.onboardingComplete===false||s.accountOpen||s.introPlaying||!s.hasStarted){hide();lastContext=null;document.body.classList.remove('journey-new');return;}
  document.body.classList.toggle('journey-new',isJourneyAccount(p));
  if(lastAccount!==p.id){lastAccount=p.id;lastMatches=p.matches||0;paused.clear();lastContext=null;hide();}
  if(!s.room&&(p.matches||0)>lastMatches){const unlocked=Object.values(FEATURES).filter(f=>f.at>lastMatches&&f.at<=p.matches);lastMatches=p.matches;if(unlocked.length&&isJourneyAccount(p)){const notice=document.createElement('div');notice.className='journey-unlock';notice.setAttribute('role','status');notice.innerHTML='<small>NOVOS CAMINHOS</small><b>'+unlocked.map(f=>f.icon+' '+f.name).join(' · ')+'</b>';document.body.append(notice);setTimeout(()=>notice.remove(),4500);}}
  for(const b of document.querySelectorAll('#app button')){
   const f=featureOf(b),locked=f&&!featureOpen(p,f);b.classList.toggle('journey-locked',!!locked);
   if(locked){b.dataset.journeyGate=f;b.setAttribute('aria-disabled','true');b.title=featureRequirement(p,f);if(!b.querySelector('.journey-lock-label'))b.insertAdjacentHTML('beforeend',`<small class="journey-lock-label">◇ ${FEATURES[f].at} ${FEATURES[f].at===1?'BATALHA':'BATALHAS'}</small>`);}
   else if(b.dataset.journeyGate){delete b.dataset.journeyGate;b.removeAttribute('aria-disabled');b.removeAttribute('title');b.querySelector('.journey-lock-label')?.remove();}
   const next=Math.min(...Object.values(FEATURES).filter(f=>f.at>(p.matches||0)).map(f=>f.at),99);
   b.classList.toggle('journey-distant',!!locked&&!s.modal&&!s.worldOpen&&FEATURES[f].at>next);
  }
  const controls=document.querySelector('#app .corner-controls');if(controls&&!controls.querySelector('[data-journey-map]'))controls.insertAdjacentHTML('beforeend','<button data-journey-map class="icon-button" aria-label="Jornada, tutoriais e desbloqueios" title="Minha jornada">⌖</button>');
  const host=document.querySelector('.academy-hub');if(host&&!host.querySelector('.journey-act')){const a=journeyAct(p);host.insertAdjacentHTML('afterbegin',`<div class="journey-act"><small>SUA PRÓXIMA ETAPA</small><h3>${a.title}</h3><p>${a.goal}</p><button data-journey-map>VER CAMINHO E DESBLOQUEIOS ↗</button></div>`);}
  const next=context();if(next!==lastContext){hide();lastContext=next;if(next&&isJourneyAccount(p)&&!paused.has(next)&&!p.journey.lessons?.[next]?.complete)begin(next);}
  else if(lessonId&&!saving){if(!next)hide();else drawCoach();}
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(coach.contains(b)&&b.hasAttribute('data-academy-start')){e.preventDefault();e.stopImmediatePropagation();hide();const start=document.querySelector('#app [data-academy-start]');if(start)start.click();else{document.querySelector('#app [data-modal="academy"]')?.click();requestAnimationFrame(()=>document.querySelector('#app [data-academy-start]')?.click());}return;}
  if(coach.contains(b)&&b.hasAttribute('data-journey-proceed')){e.preventDefault();e.stopImmediatePropagation();paused.add('dungeon');hide();document.querySelector('#app [data-start="dungeon"]')?.click();return;}
  if(b.hasAttribute('data-journey-map')){e.preventDefault();e.stopImmediatePropagation();openMap();return;}
  if(b.dataset.start==='dungeon'&&!b.hasAttribute('data-journey-proceed')&&isJourneyAccount(getState().profile)&&featureOpen(getState().profile,'dungeon')&&!getState().profile.journey.lessons?.dungeon?.complete&&!paused.has('dungeon')){e.preventDefault();e.stopImmediatePropagation();begin('dungeon');return;}
  const feature=featureOf(b);if(feature&&!featureOpen(getState().profile,feature)){e.preventDefault();e.stopImmediatePropagation();openMap(feature);return;}
 },true);
 coach.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||saving||!lessonId||!b.matches('[data-journey-back],[data-journey-next],[data-journey-pause]'))return;const id=lessonId,previous=step;
  if(b.hasAttribute('data-journey-back'))step=Math.max(0,step-1);
  else if(b.hasAttribute('data-journey-next'))step++;
  saving=true;drawCoach();
  try{await save(id,step);saving=false;if(lessonId!==id)return;if(b.hasAttribute('data-journey-pause')||step>=JOURNEY_LESSONS[id].steps.length){paused.add(id);hide();}else drawCoach();}
  catch{if(lessonId!==id){saving=false;return;}step=previous;saving=false;drawCoach();coach.querySelector('.journey-save-error').textContent='Não foi possível salvar. Tente novamente.';}
 });
 map.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-journey-close'))map.close();if(b.hasAttribute('data-journey-training')){map.close();document.querySelector('[data-modal="academy"]')?.click();requestAnimationFrame(()=>document.querySelector('[data-academy-start]')?.click());}if(b.dataset.journeyReplay){map.close();begin(b.dataset.journeyReplay,true);}});
 map.addEventListener('keydown',e=>e.stopPropagation());map.addEventListener('cancel',()=>{});
 new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(decorate);}).observe(document.querySelector('#app'),{childList:true,subtree:true});
 decorate();
}
