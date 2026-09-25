const object=id=>`/assets/world/objects/${id}.png`;
const themes={
 character:['Seu viajante','Sangue, origem e destino','portrait-frame'],
 skills:['Maestrias','A prática deixa sua marca','blacksmith'],
 profession:['Ofícios','O trabalho sustenta a linhagem','wolf-crest'],
 lore:['Crônicas','Memórias de um reino vivo','oath-banner'],
 karma:['Renome de caça','Toda vitória deixa um sinal','war-emblem'],
 grimoire:['Grimório','Quatro escolhas. Seu estilo de combate.','twin-moon-crest'],
 campaign:['Conselho','Decida o futuro do domínio','crown-emblem'],
 atlas:['Atlas','Escolha seu próximo horizonte','compass'],
 hub:['Reino de Véspera','O que a noite reserva para você?','watch-camp'],
 guide:['Guia da Vigília','Aprenda os gestos da caçada','war-emblem']
};
const cardArt={
 'data-ra-profession':'monster-bones','data-ra-edict':'oath-banner',
 'data-ra-dispatch':'moon-caravan','data-ra-choice':'twin-moon-crest',
 'data-ra-repair':'blacksmith','data-ra-lineage':'vampire-crest'
};
function illustration(node,src){
 const image=document.createElement('img');image.src=src;image.alt='';image.className='ra-concept-art';image.loading='lazy';node.prepend(image);
}
/** Enhance rendered sections without changing action attributes or game rules. */
export function illustrateCodex(content,tab){
 if(['inventory','grimoire'].includes(tab)){content.dataset.codexPage=tab;return;}
 const [title,subtitle,crest]=themes[tab]||themes.hub;
 content.dataset.codexPage=tab;
 const hero=document.createElement('section');hero.className='ra-codex-hero';
 const eyebrow=document.createElement('small');eyebrow.textContent='CÓDICE DE VÉSPERA';
 const heading=document.createElement('h2');heading.textContent=title;
 const copy=document.createElement('p');copy.textContent=subtitle;
 hero.append(eyebrow,heading,copy);illustration(hero,object(crest));content.prepend(hero);
 // Keep explanations one gesture away; costs, requirements and action labels
 // stay on their cards. Lore prose remains the primary content of its page.
 const explanations=content.querySelectorAll(':scope > p,.ra-profession-note,.ra-karma-rule,.ra-life-skills > header > p,.ra-skill-tree > p,.ra-profession-hero p,.ra-lore-hero > p,.ra-lineage-economy > p,.ra-lineage-economy > small');
 explanations.forEach((node,index)=>{
  if(node.textContent.length<95)return;
  const detail=document.createElement('details');detail.className='ra-codex-details';detail.dataset.codexDetail=`${tab}-${index}`;
  const summary=document.createElement('summary');summary.textContent='Como funciona';node.replaceWith(detail);detail.append(summary,node);
 });
 for(const [attribute,art] of Object.entries(cardArt))for(const node of content.querySelectorAll(`.ra-talents > button[${attribute}],.ra-paths > button[${attribute}],.ra-profession-actions > button[${attribute}]`)){
  if(!node.querySelector('img'))illustration(node,object(art));
  node.classList.add('ra-concept-card');
 }
 for(const group of content.querySelectorAll('.ra-skill-group')){
  const icon=['fallen-timber','twin-moon-crest','blacksmith'][[...content.querySelectorAll('.ra-skill-group')].indexOf(group)];
  illustration(group.querySelector('h4'),object(icon));
 }
 for(const node of content.querySelectorAll('.ra-skill-tree article')){
  const branch=node.querySelector('small')?.textContent||'';
  illustration(node,object(/COMBATE/.test(branch)?'war-emblem':/COLETA/.test(branch)?'fallen-timber':'twin-moon-crest'));
 }
 for(const node of content.querySelectorAll('.ra-lore article'))illustration(node,object(node.classList.contains('sealed')?'dungeon-gate':'oath-banner'));
 for(const node of content.querySelectorAll('.ra-profession-servants article'))illustration(node,object('vampire-crest'));
}
