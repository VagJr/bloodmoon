import {CARDS} from '/shared/cards.js';
import {CODEX,cardTerms,termDescription,QUICK_RULES} from '/shared/codex.js';

// Engraved silhouettes share one frame, but retain distinct shapes without color.
const paths={
 lifesteal:'M16 3C13 9 7 14 7 20a9 9 0 0 0 18 0c0-6-6-11-9-17Zm-4 18c0 3 2 4 4 4M3 9h7M6 6 3 9l3 3',
 bleed:'m10 3-6 15m13-13-6 19M25 8l-6 19M6 26l-1 3m10-2-1 3',
 guard:'m16 3 11 5-2 13-9 8-9-8L5 8Zm0 5v15M10 12h12',
 overwhelm:'M3 23h20m-6-7 7 7-7 7M4 13h11m-5-5 5 5-5 5M26 3v13',
 fury:'M17 2 7 18h8l-2 12 12-18h-9Z',
 pierce:'m5 27 20-20m-8 0h8v8M6 16l10 10M3 22l7 7',
 focus:'m16 3 13 13-13 13L3 16Zm0 8 5 5-5 5-5-5Z',
 mend:'M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9Z',
 synergy:'M12 9 8 5 2 11l8 8 7-7m3 11 4 4 6-6-8-8-7 7M10 22l12-12',
 sacrifice:'M16 3v25M9 10h14M8 22l8 7 8-7',
 conquest:'M5 27h22M8 23V12L4 5l9 5 3-7 3 7 9-5-4 7v11ZM9 18h14',
 influence:'M5 27h22M8 23V12L4 5l9 5 3-7 3 7 9-5-4 7v11ZM9 18h14',
 damage:'m7 27 19-21 2-4-5 2L4 24m0-6 10 10M3 29l4-4',
 heal:'M16 28 4 15C-2 4 11 0 16 9c5-9 18-5 12 6ZM13 16h6m-3-3v6',
 execute:'M7 20V12a9 9 0 0 1 18 0v8l-5 2v6h-8v-6ZM10 14h3m6 0h3m-7 4h2M16 23v5',
 pounce:'M3 26C6 10 17 5 27 8m-7-5 8 5-6 7M8 27c4-9 10-11 16-10',
 rend:'M7 3 3 24 12 12 9 29 22 10 20 27 29 5',
 draw:'M4 9h17v20H4Zm6-5h16v20M15 1h15v18',
 equipment:'m5 28 13-13M17 4a8 8 0 0 0 11 11l-7-2-2-5 2-6ZM3 24l5 5M5 6l21 21M3 3l7 3-4 4Z',
 energy:'M16 2 5 19l11 11 11-11ZM16 8v17M6 19h20',
 supplies:'M5 12h22v16H5ZM3 7h26v5H3Zm11 0V3h4v4M13 12v7h6v-7',
 coins:'M27 16a11 11 0 1 1-22 0 11 11 0 0 1 22 0ZM16 9l6 7-6 7-6-7Z',
 experience:'m16 2 4 9 10 1-8 7 3 11-9-6-9 6 3-11-8-7 10-1Z',
 stories:'M16 8C11 3 5 4 2 5v22c5-2 10-2 14 1 4-3 9-3 14-1V5c-3-1-9-2-14 3Zm0 0v20M6 10h6m-6 5h6m8-5h6m-6 5h6',
 ready:'m5 16 7 8L28 6',
 reserve:'M5 13a11 11 0 0 1 21-2M26 4v8h-8M27 20A11 11 0 0 1 6 22m0 6v-7h8',
 bound:'m11 21-3 3a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 0m6 1 3-3a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0M10 22l12-12',
 combo:'m6 3 6 6-6 6-6-6Zm10 7 6 6-6 6-6-6Zm10 7 6 6-6 6-6-6Z'
};
const aliases={drain:'lifesteal',rage:'fury',rally:'conquest',durability:'equipment',scrap:'equipment',favors:'influence',siege:'damage',renown:'conquest',dust:'focus',provisions:'supplies',doctrine:'conquest'};
const flows={lifesteal:['Atacar','Dano real','Curar líder'],bleed:['Ferir','Sobrevive?','Sangra no confronto'],guard:['Receber dano','Bloquear 1','Renovar na rodada'],overwhelm:['Derrotar alvo','Dano excedente','Líder rival'],synergy:['Evento na frente','Selo desperta','1× por rodada'],equipment:['Peça no deck','Equipar aliado','Desgaste após luta'],pounce:['Fortalecer','Preparar','Atacar de novo'],rend:['Escolher criatura','Dano','Sangrar se viva'],drain:['Ferir criatura','Curar líder','Marcar sobrevivente'],conquest:['Somar poder','Vencer frente','Ganhar recursos'],durability:['Usar peça','Desgastar','Reserva / reparo'],combo:['Jogar 3 cartas','2 dano rival','+2 Frenesi']};
const palette={Combate:'blood',Equipamentos:'steel',Frentes:'gold',Recursos:'jade',Progressão:'violet'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function seal(key){const d=paths[key]||paths[aliases[key]]||paths.focus;return `<span class="keyword-seal" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg></span>`;}
function entry(key,c,compact=false){const [name,,category]=CODEX[key],steps=flows[key];return `<details class="keyword-entry tone-${palette[category]}" ${compact?'open':''}><summary>${seal(key)}<span><small>${category}</small><b>${name}</b></span><i aria-hidden="true">＋</i></summary><div class="keyword-explanation">${steps?`<ol class="keyword-flow">${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}<p>${esc(termDescription(key,c))}</p></div></details>`;}
function ribbon(c){return `<span class="keyword-ribbon" aria-hidden="true">${cardTerms(c).slice(0,3).map(k=>`<span class="tone-${palette[CODEX[k][2]]}" title="${esc(CODEX[k][0]+': '+termDescription(k,c))}">${seal(k)}</span>`).join('')}</span>`;}
function quickRule(key,c){
 if(c.type==='equipment'){
  const gear={equipment:'Até 2 por aliado · 1 no líder',pierce:'Aliado: +1 dano · líder: +1 dano de habilidade',focus:'Aliado: +1 influência · líder: +1 dano de habilidade',mend:'Cura 1: aliado após ataque; líder ao equipar/usar habilidade',fury:'Frenesi extra: aliado ao atacar; líder ao equipar/usar habilidade',rally:'Aliado: +1 ataque temporário · líder: +1 poder na frente'};
  if(gear[key])return gear[key];
 }
 return QUICK_RULES[key]||termDescription(key,c);
}
let frame=0;
function decorate(){
 frame=0;
 for(const el of document.querySelectorAll('.game-card[data-preview],.fighter[data-preview]')){
  if(el.dataset.codexSeal)continue;el.dataset.codexSeal='1';const c=CARDS[el.dataset.preview];if(c&&cardTerms(c).length)el.insertAdjacentHTML('beforeend',ribbon(c));
 }
 for(const copy of document.querySelectorAll('.inspect-copy,.preview-card-copy,.touch-preview-copy')){
  if(copy.querySelector('.keyword-scripture'))continue;
  const parent=copy.parentElement,c=CARDS[parent.querySelector('[data-preview]')?.dataset.preview];if(!c)continue;
  const keys=cardTerms(c);if(!keys.length)continue;
  const full=copy.matches('.inspect-copy'),block=document.createElement('section');block.className='keyword-scripture';
  block.innerHTML=`${full?'<h4><span>✧</span> SELOS DA CARTA <span>✧</span></h4>':''}${full?keys.map(k=>entry(k,c)).join(''):keys.map(k=>`<div class="keyword-glance tone-${palette[CODEX[k][2]]}">${seal(k)}<p><b>${CODEX[k][0]}</b><span>${esc(quickRule(k,c))}</span></p></div>`).join('')}${full?'<button type="button" class="codex-link" data-codex-open>ABRIR CÓDICE · TODAS AS MECÂNICAS ↗</button>':''}`;
  const flavor=full&&copy.querySelector('blockquote');if(flavor)flavor.before(block);else copy.append(block);
 }
 for(const controls of document.querySelectorAll('.corner-controls,.game-window-nav')){
  if(controls.querySelector('[data-codex-open]'))continue;
  const button=document.createElement('button');button.type='button';button.dataset.codexOpen='';button.className=controls.matches('.corner-controls')?'icon-button codex-launch':'codex-link';button.setAttribute('aria-label','Códice de selos: mecânicas, economia e progressão');button.title='Códice de selos';button.innerHTML=seal('stories')+(controls.matches('.game-window-nav')?'Códice':'');controls.append(button);
 }
 for(const [selector,keys] of [['.collection-wallet,.realm-wallet',['coins','dust','experience']],['.realm-materials',['provisions','scrap']],['.forge-summary',['equipment','durability','reserve']],['.battle-codex',['conquest','favors','supplies','siege']]]){
  for(const host of document.querySelectorAll(selector)){
   if(host.querySelector('.codex-context')||host.closest('button'))continue;
   const bar=document.createElement('div');bar.className='codex-context';bar.setAttribute('aria-label','Entender estes indicadores');
   bar.innerHTML=keys.map(k=>`<button type="button" class="tone-${palette[CODEX[k][2]]}" data-codex-open data-codex-term="${k}" title="${esc(CODEX[k][0]+': '+termDescription(k))}">${seal(k)}<span>${CODEX[k][0]}</span></button>`).join('');host.append(bar);
  }
 }
 for(const [selector,key] of [['.refuge-wallet>div:nth-child(1)','coins'],['.refuge-wallet>div:nth-child(2)','dust'],['.refuge-wallet>div:nth-child(3)','scrap'],['.refuge-xp-block','experience']]){
  for(const host of document.querySelectorAll(selector)){
   if(host.querySelector('[data-resource-help]'))continue;
   host.insertAdjacentHTML('beforeend',`<button class="resource-help tone-${palette[CODEX[key][2]]}" data-resource-help data-codex-open data-codex-term="${key}" aria-label="Entender ${CODEX[key][0]}" title="${esc(termDescription(key))}">?</button>`);
  }
 }
}
const dialog=document.createElement('dialog');dialog.className='codex-dialog';dialog.setAttribute('aria-labelledby','codex-title');
dialog.innerHTML=`<header class="codex-cover">${seal('stories')}<div><small>ARQUIVO DA VIGÍLIA · VÉSPERA</small><h2 id="codex-title">Códice de selos</h2><p>Reconheça o símbolo. Domine a noite.</p></div><button type="button" data-codex-close aria-label="Fechar códice">×</button></header><div class="codex-tools"><label><span>Buscar um selo ou efeito</span><input type="search" placeholder="Drenar, reparo, Corte…" autocomplete="off"></label><nav aria-label="Categorias do códice">${['Todos',...new Set(Object.values(CODEX).map(v=>v[2]))].map((v,i)=>`<button type="button" data-category="${v}" aria-pressed="${!i}">${v}</button>`).join('')}</nav></div><div class="codex-results" aria-live="polite"></div><footer>Os símbolos são os mesmos nas cartas e na inspeção. Toque em um selo para desvendar sua regra.</footer>`;
document.body.append(dialog);
let category='Todos',returnFocus=null;
const input=dialog.querySelector('input'),results=dialog.querySelector('.codex-results');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function search(){const q=normalize(input.value);const entries=Object.entries(CODEX).filter(([,v])=>(category==='Todos'||category===v[2])&&normalize(v.join(' ')).includes(q));results.innerHTML=entries.map(([k])=>entry(k)).join('')||'<p class="codex-empty">Nenhum selo encontrado. Tente outro nome ou categoria.</p>';}
function close(){dialog.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
document.addEventListener('click',event=>{const button=event.target.closest('[data-codex-open]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();returnFocus=button;category='Todos';input.value=button.dataset.codexTerm?CODEX[button.dataset.codexTerm][0]:'';dialog.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));search();if(button.dataset.codexTerm)results.querySelector('details')?.setAttribute('open','');dialog.showModal();input.focus();},true);
dialog.addEventListener('click',event=>{if(event.target.closest('[data-codex-close]'))close();const button=event.target.closest('[data-category]');if(button){category=button.dataset.category;dialog.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));search();}});
// Native modal provides focus containment and Escape; don't leak Escape into the game.
dialog.addEventListener('keydown',event=>event.stopPropagation());
dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
input.addEventListener('input',search);
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches('.keyword-ribbon,.keyword-scripture,[data-codex-open]')&&!n.closest('.codex-dialog,.keyword-scripture,.keyword-ribbon')))&&!frame)frame=requestAnimationFrame(decorate);}).observe(document.querySelector('#app'),{childList:true,subtree:true});
// Hover/touch previews live outside #app and are replaced independently.
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#card-preview,#touch-card-preview,.preview-card-face,.touch-preview-face')||n.querySelector('#card-preview,#touch-card-preview,.preview-card-face,.touch-preview-face'))))&&!frame)frame=requestAnimationFrame(decorate);}).observe(document.body,{childList:true,subtree:true});
decorate();
