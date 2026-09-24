const installed=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
let nativePrompt=null,veil=null,installing=false;
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const isAndroid=/android/i.test(navigator.userAgent);
const dismissKey='bloodmoon.install.dismissed.v1';
function close(){veil?.remove();veil=null;}
function instructions(){return isiOS?'No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. Depois, abra Bloodmoon pelo novo ícone.':isAndroid?'Se a confirmação automática não aparecer, abra o menu ⋮ do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.':'Este navegador não liberou a instalação agora. Acesse pelo Chrome ou Edge atualizado para instalar Bloodmoon.';}
function show(){
 if(installed()||veil)return;
 veil=document.createElement('div');veil.className='install-veil';veil.innerHTML=`<section class="install-card" role="dialog" aria-modal="true" aria-labelledby="install-title"><button class="install-close" data-install-close aria-label="Fechar">×</button><div class="install-brand"><img src="/app-icon.svg" alt=""><span><small>CRÔNICAS DE VÉSPERA</small><h2 id="install-title">Leve a noite com você.</h2></span></div><p>Instale Bloodmoon como um app. O mesmo jogo, com ícone próprio e uma entrada imersiva em tela cheia.</p><div class="install-benefits"><span>✦ ÍCONE EXCLUSIVO</span><span>⚔ ABRE DIRETO NO JOGO</span><span>☾ TELA DE APP</span></div><button class="install-primary" data-install-confirm>${nativePrompt?'INSTALAR BLOODMOON':'COMO INSTALAR'}</button><div class="install-help" hidden></div><button class="install-later" data-install-close>AGORA NÃO</button></section>`;
 document.body.append(veil);
 veil.addEventListener('click',async event=>{
  const target=event.target.closest('[data-install-close],[data-install-confirm]');if(!target)return;
  if(target.hasAttribute('data-install-close')){localStorage.setItem(dismissKey,String(Date.now()));close();return;}
  const help=veil.querySelector('.install-help');
  if(nativePrompt){const prompt=nativePrompt;nativePrompt=null;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted'){localStorage.removeItem(dismissKey);close();}else{localStorage.setItem(dismissKey,String(Date.now()));target.textContent='INSTALAÇÃO ADIADA';}}catch{help.hidden=false;help.textContent=instructions();}}
  else if(!help.hidden){localStorage.setItem(dismissKey,String(Date.now()));close();}
  else{help.hidden=false;help.textContent=instructions();target.textContent=isiOS?'ENTENDI · COMO ADICIONAR':'ENTENDI';}
 });
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();nativePrompt=event;document.querySelectorAll('[data-install-app]').forEach(button=>button.classList.add('install-ready'));if(location.pathname.startsWith('/play')&&!installed()&&Date.now()-Number(localStorage.getItem(dismissKey)||0)>30*24*60*60*1000)setTimeout(show,1200);});
window.addEventListener('appinstalled',()=>{nativePrompt=null;localStorage.removeItem(dismissKey);close();});
document.addEventListener('click',event=>{if(event.target.closest('[data-install-app]')){event.preventDefault();show();}});
if('serviceWorker'in navigator&&(/https:$/.test(location.protocol)||['localhost','127.0.0.1'].includes(location.hostname))){
 const hadController=!!navigator.serviceWorker.controller;let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloading){reloading=true;location.reload();}});
 navigator.serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
}
const recent=Number(localStorage.getItem(dismissKey)||0),mobileInstallable=isiOS||isAndroid;
if(location.pathname.startsWith('/play')&&!installed()&&Date.now()-recent>30*24*60*60*1000&&(nativePrompt||mobileInstallable))setTimeout(show,1600);
