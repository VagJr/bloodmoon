const bindings={
 Space:['[data-pass]','Space','ESPAÇO','Encerrar rodada'],
 KeyQ:['[data-power="skill"]','Q','Q','Selecionar habilidade'],
 KeyR:['[data-power="ultimate"]','R','R','Selecionar suprema'],
 KeyH:['[data-modal="chronicle"]','H','H','Histórico da partida'],
 KeyI:['.corner-controls [data-rpg-open]','I','I','Ficha RPG'],
 KeyM:['[data-sound]','M','M','Ativar / desativar som'],
 KeyV:['[data-combat-speed]','V','V','Alternar velocidade'],
 KeyK:['[data-keyboard-help]','K','K','Consultar atalhos']
};
export function installBattleKeyboard(getState){
 const help=document.createElement('dialog');help.className='battle-keyboard-help';
 help.setAttribute('aria-label','Atalhos de combate');
 help.innerHTML=`<header><div><small>COMANDOS DA VIGÍLIA</small><h2>Atalhos de combate</h2></div><button aria-label="Fechar atalhos">×</button></header><dl>${Object.values(bindings).map(([, ,key,label])=>`<div><dt><kbd>${key}</kbd></dt><dd>${label}</dd></div>`).join('')}<div><dt><kbd>1–9 / 0</kbd></dt><dd>Selecionar carta da mão · 0 é a décima</dd></div><div><dt><kbd>ESC</kbd></dt><dd>Cancelar seleção / voltar / abrir pausa</dd></div></dl><p>Habilidade, suprema e carta ainda precisam de um alvo. Espaço encerra sua participação na rodada. Atalhos ficam suspensos em menus e campos de texto.</p>`;
 document.body.append(help);let returnFocus;
 const close=()=>{help.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});};
 help.querySelector('button').addEventListener('click',close);
 help.addEventListener('cancel',e=>{e.preventDefault();close();});
 help.addEventListener('keydown',e=>e.stopPropagation());
 document.addEventListener('click',e=>{const b=e.target.closest('[data-keyboard-help]');if(!b)return;returnFocus=b;help.showModal();},true);
 function decorate(){
  const arena=document.querySelector('.arena');if(!arena)return;
  const controls=arena.querySelector('.corner-controls');
  if(controls&&!controls.querySelector('[data-keyboard-help]'))controls.insertAdjacentHTML('beforeend','<button class="icon-button keyboard-help-button" data-keyboard-help aria-label="Atalhos de teclado" title="Atalhos de teclado · K">⌨</button>');
  for(const [selector,aria,key] of Object.values(bindings)){
   const b=arena.querySelector(selector);if(!b||b.dataset.keyHint)continue;
   b.dataset.keyHint=key;b.setAttribute('aria-keyshortcuts',aria);b.title=(b.title?b.title+' · ':'')+key;
  }
  arena.querySelectorAll('.hand-fan [data-card]').forEach((b,i)=>{b.setAttribute('aria-keyshortcuts',String((i+1)%10));b.dataset.handKey=String((i+1)%10);});
 }
 const editable=el=>el instanceof Element&&!!el.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
 let spaceCaptured=false;
 document.addEventListener('keydown',e=>{
  const s=getState();
  if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||editable(e.target)||!s.playing||s.modal||s.dragging||document.querySelector('dialog[open]')||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const number=/^Digit[0-9]$/.test(e.code)?Number(e.code.slice(-1)):null;
  if(!bindings[e.code]&&number===null)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.code==='Space')spaceCaptured=true;
  if(e.repeat)return;
  const arena=document.querySelector('.arena');if(!arena)return;
  if(number!==null){
   if(!s.canAct)return;
   const cards=arena.querySelectorAll('.hand-fan [data-card]'),b=cards[number===0?9:number-1];
   if(b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true')b.click();return;
  }
  if(['Space','KeyQ','KeyR'].includes(e.code)&&!s.canAct)return;
  const b=arena.querySelector(bindings[e.code][0]);
  if(b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true')b.click();
 },true);
 document.addEventListener('keyup',e=>{if(e.code==='Space'&&spaceCaptured){spaceCaptured=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('blur',()=>spaceCaptured=false);
 let frame=0;
 new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;decorate();});}).observe(document.querySelector('#app'),{childList:true,subtree:true});
 decorate();
}
