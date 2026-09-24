const themes={decks:['Câmara de guerra','Prepare seu próximo juramento','siege-board','♜'],market:['Relicário do crepúsculo','Restaurar · forjar · negociar','crypt-board','⚒'],contracts:['Mural da Vigília','Toda caçada deixa uma recompensa','forest-board','⚔'],collection:['Arsenal de Véspera','Descubra a próxima sinergia','court-board','◈'],loadout:['Armar a expedição','Escolha a posição. Prepare a relíquia.','siege-board','⚒'],legacy:['Salão dos juramentos','A noite guarda seu nome','court-board','♛'],academy:['A jornada de Iria','Aprenda cada gesto da caçada','forest-board','✧']};
function decorate(){
 const panel=document.querySelector('.menu-backdrop .game-modal');if(!panel||panel.dataset.gameWindow)return;
 if(panel.closest('.menu-market'))return;
 const theme=Object.entries(themes).find(([id])=>panel.closest('.menu-'+id));if(!theme)return;
 panel.dataset.gameWindow='1';panel.classList.add('game-window');
 const [id,[title,subtitle,board,glyph]]=theme;
 panel.style.setProperty('--window-scene',`url('/assets/world/${board}.png')`);
 const header=document.createElement('header');header.className='game-window-banner';
 header.innerHTML=`<span class="window-emblem" aria-hidden="true">${glyph}</span><div><small>BLOODMOON · VÉSPERA</small><h2>${title}</h2><p>${subtitle}</p></div>`;
 panel.prepend(header);
 const navigation=document.createElement('nav');navigation.className='game-window-nav';navigation.setAttribute('aria-label','Áreas do refúgio');
 for(const [key,label,icon]of [['collection','Arsenal','◈'],['decks','Decks','♜'],['loadout','Equipar','⚒'],['boosters','Boosters','✦'],['market','Relicário','♦'],['contracts','Contratos','⚔']]){
  const button=document.createElement('button');button.dataset.modal=key;button.textContent=icon+' '+label;if(key===id)button.setAttribute('aria-current','page');navigation.append(button);
 }
 header.after(navigation);
 const helper=panel.querySelector('.mentor-note');if(helper){const details=document.createElement('details'),summary=document.createElement('summary');details.className='window-help';summary.textContent='✧ Orientação de Iria';details.append(summary);helper.replaceWith(details);details.append(helper);}
}
const app=document.querySelector('#app');new MutationObserver(decorate).observe(app,{childList:true});decorate();
