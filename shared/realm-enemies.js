import {WORLD_MAP_BOUNDS} from './realm-geography.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export const ENEMY_STYLES=Object.freeze({
 raider:{id:'raider',damageType:'physical',cardId:'thrall',hp:1,damage:.92,speed:1.45,range:2.5,aggro:13,windup:480,cooldown:1650,names:['Rastejante da Cinza','Cortador de Trilhas','Caçador do Véu']},
 brute:{id:'brute',damageType:'physical',cardId:'ravager',hp:1.62,damage:1.42,speed:.72,range:2.2,aggro:11,windup:1050,cooldown:2650,radius:1.8,heavy:true,names:['Quebra-ossos','Colosso da Fenda','Carrasco de Cinzas']},
 arcanist:{id:'arcanist',damageType:'magic',cardId:'elder',hp:.86,damage:1.12,speed:.78,range:8.5,aggro:14,windup:900,cooldown:2350,radius:1.45,names:['Vidente do Véu','Acólito da Fome','Oráculo Desfeito']},
 hunter:{id:'hunter',damageType:'physical',cardId:'duelist',hp:.92,damage:1.03,speed:1.08,range:7.5,aggro:15,windup:720,cooldown:1900,ranged:true,names:['Batedor da Lua Morta','Atirador da Corte','Rastreador de Ossos']},
 sentinel:{id:'sentinel',damageType:'physical',cardId:'warden',hp:1.38,damage:1.08,speed:.88,range:2.4,aggro:10,windup:690,cooldown:2050,guard:true,names:['Sentinela Reversa','Guardião sem Rosto','Carcereiro do Pacto']}
});
const COMPOSITIONS=[['raider','brute','arcanist'],['raider','hunter','sentinel'],['brute','arcanist','hunter'],['raider','arcanist','sentinel'],['brute','hunter','sentinel']];
const HABITATS={
 forest:{styles:['hunter','raider','brute','arcanist'],names:['Rastreador do Sub-bosque','Fera da Lua Velada','Espinheiro Desperto','Bruxa das Raízes']},
 marsh:{styles:['arcanist','raider','brute','hunter'],names:['Morto do Lodo','Sangria do Pântano','Besta do Brejo','Vidente do Miasma']},
 mountain:{styles:['brute','sentinel','hunter','arcanist'],names:['Quebra-Pedra','Vigia das Escarpas','Atirador do Abismo','Oráculo da Geada']},
 ruins:{styles:['arcanist','sentinel','brute','raider'],names:['Eco do Templo','Custódio Caído','Ídolo Desperto','Profanador']},
 city:{styles:['sentinel','hunter','raider','arcanist'],names:['Guarda Corrompido','Mercenário Sem Nome','Saqueador da Corte','Cultista do Sino']},
 snow:{styles:['hunter','sentinel','arcanist','brute'],names:['Lobo da Nevasca','Vigia do Gelo','Bruxa da Aurora','Colosso de Inverno']},
 volcanic:{styles:['brute','arcanist','sentinel','raider'],names:['Forjado em Brasa','Piromante do Véu','Sentinela de Obsidiana','Fera de Cinza']},
 astral:{styles:['arcanist','hunter','sentinel','brute'],names:['Eco da Estrela','Caçador Celeste','Custódio do Véu','Meteoro Vivo']},
 citadel:{styles:['sentinel','brute','arcanist','hunter'],names:['Guarda do Eclipse','Carrasco do Trono','Teurgo da Corte','Atirador da Coroa']}
};
export function regionThreatLevel(region){return Math.min(40,Math.max(1,(region.recommendedLevel||region.level||1)+(region.kind==='capital'?1:0)));}
export function regionLevelRange(region){const level=regionThreatLevel(region);return {min:Math.max(1,level-1),max:Math.min(42,level+2)};}
export function createRegionEnemies(region,now=Date.now()){
 if(region.kind==='sanctuary')return [];
 const level=regionThreatLevel(region),habitat=HABITATS[region.habitat],composition=habitat?.styles||COMPOSITIONS[(Math.floor(region.x/100)+region.level+region.y)%COMPOSITIONS.length];
 const zones=Array.isArray(region.spawnZones)&&region.spawnZones.length?region.spawnZones.slice(0,4):null,count=zones?.length||(level>=7?4:3);
 return Array.from({length:count},(_,index)=>{
  const zone=zones?.[index],style=ENEMY_STYLES[zone?.style]||ENEMY_STYLES[composition[index%composition.length]],tier=zone?.tier;
  const rank=tier==='elite'||tier==='boss'||Number(tier)>=4||(!tier&&index===3)?'elite':tier==='veteran'||Number(tier)>=2||(!tier&&index===1&&level>=10)?'veteran':'common';
  const levelOffset=rank==='elite'?2:rank==='veteran'?1:index===0?0:index===1?1:-1,enemyLevel=clamp(level+levelOffset,1,42);
  const hp=Math.ceil((24+enemyLevel*12)*style.hp*(rank==='elite'?1.55:rank==='veteran'?1.2:1)),attack=Math.ceil((4+enemyLevel*1.55)*style.damage*(rank==='elite'?1.22:rank==='veteran'?1.1:1));
  const angle=index*2.399+region.x*.013,radius=zone?Math.min(2,Math.max(0,Number(zone.radius)||0))*.35:7.2+(index%2)*1.8,center=zone||region;
  const x=clamp(center.x+Math.cos(angle)*radius/1.5,2,WORLD_MAP_BOUNDS.maxX-1),y=clamp(center.y+Math.sin(angle)*radius,2,98),name=habitat?.names[index%habitat.names.length]||style.names[(Math.floor(region.x)+index)%style.names.length];
  return {id:`${region.id}-threat-${style.id}-${index}`,node:region.id,provinceId:region.provinceId||null,habitat:region.habitat||null,kind:'hostile',name:`${rank==='elite'?'ÉLITE · ':rank==='veteran'?'VETERANO · ':''}${name}`,faction:style.id==='raider'||style.id==='brute'?'werewolf':'vampire',cardId:style.cardId,x,y,homeX:x,homeY:y,hp,maxHp:hp,attack,level:enemyLevel,aiStyle:style.id,damageType:style.damageType,ranged:!!style.ranged,attackAt:now+500+index*430,phase:index*1.6,respawnAt:0,state:`${style.id==='brute'?'Golpe de ruptura':style.id==='arcanist'?'Ritual de área':style.id==='hunter'?'Disparo de precisão':style.id==='sentinel'?'Guarda e contra-ataque':'Investida'} · nível ${enemyLevel}`};
 });
}
export function enemyStyle(actor){const magic=actor.damageType==='magic'||actor.attackType==='magic';return ENEMY_STYLES[actor.aiStyle]||{id:'raider',damageType:magic?'magic':'physical',speed:1,range:actor.ranged||magic?8:2.8,aggro:actor.kind==='invader'?13:9,windup:magic?950:680,cooldown:2200,radius:0,heavy:false};}
