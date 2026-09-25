import {RuleError} from './engine.js';

// Ten active skills per class: thirty per lineage. Each tree has three paths.
export const REALM_CLASSES={
 vampire_exile:{id:'vampire_exile',faction:'vampire',origin:'exile',name:'Duelista Carmesim',role:'Combate próximo · roubo de vida',branches:['Lâmina','Predação','Soberania'],color:'#e17c8e',art:0},
 vampire_keeper:{id:'vampire_keeper',faction:'vampire',origin:'keeper',name:'Guardião Sepulcral',role:'Barreiras · controle · sustentação',branches:['Bastião','Sepultura','Juramento'],color:'#d2b783',art:10},
 vampire_wanderer:{id:'vampire_wanderer',faction:'vampire',origin:'wanderer',name:'Teurgo do Sangue',role:'Feitiços · drenagem · explosões',branches:['Hemomancia','Véu','Eclipse'],color:'#b88ee2',art:20},
 werewolf_exile:{id:'werewolf_exile',faction:'werewolf',origin:'exile',name:'Rasga-Luas',role:'Garras · pressão · execução',branches:['Garras','Frenesi','Alfa'],color:'#db9868',art:0},
 werewolf_keeper:{id:'werewolf_keeper',faction:'werewolf',origin:'keeper',name:'Guardião da Matilha',role:'Resistência · raízes · recuperação',branches:['Rocha','Espinhos','Matilha'],color:'#a4c798',art:10},
 werewolf_wanderer:{id:'werewolf_wanderer',faction:'werewolf',origin:'wanderer',name:'Oráculo Lunar',role:'Magia lunar · gelo · tempestade',branches:['Lua','Inverno','Tormenta'],color:'#83c5e3',art:20}
};
// [name, combat archetype, modifications]. Mechanics are consumed by combat, not just tooltips.
const skills={
 vampire_exile:[['Estocada Rubra','cleave',{area:0,range:4,dice:8,energy:10,cooldown:2800,leech:.15}],['Fio de Obsidiana','cleave',{dice:12,area:0,energy:18}],['Corte da Corte','cleave',{dice:14,range:5.5,leech:.15}],['Sentença Carmesim','cleave',{dice:20,execute:.4,cooldown:16000,energy:30}],['Olhar Predador','bolt',{dice:7,rootMs:1000,mana:12,cooldown:7000}],['Beijo da Noite','drain',{dice:14,leech:.65,cooldown:10000}],['Banquete do Caçador','tempest',{dice:10,leech:.35,area:3,cooldown:21000}],['Selo do Exilado','guard',{shieldScale:.85,cooldown:11000}],['Sangue Nobre','mend',{healDice:10,cooldown:15000}],['Coroa da Ruptura','frost',{dice:14,rootMs:2600,area:4,cooldown:22000}]],
 vampire_keeper:[['Lança de Ossos','bolt',{dice:8,mana:8,cooldown:2600}],['Égide Sepulcral','guard',{shieldScale:1.25,cooldown:12000}],['Muralha de Espinhos','guard',{shieldScale:1.6,cooldown:18000,mana:12}],['Catedral de Ossos','guard',{shieldScale:2.2,cooldown:27000,mana:25}],['Mão da Sepultura','frost',{dice:6,rootMs:1400,area:2,mana:16}],['Geada Funerária','frost',{dice:10,rootMs:2200,area:3}],['Rei Sepultado','tempest',{dice:12,rootMs:2500,area:4,cooldown:24000}],['Cálice do Juramento','mend',{healDice:6,cooldown:12000,mana:14}],['Pacto de Marfim','drain',{dice:12,leech:.75,cooldown:11000}],['Coração Imortal','mend',{healDice:16,cooldown:26000,mana:34}]],
 vampire_wanderer:[['Agulha Hemática','bolt',{dice:8,mana:7,cooldown:2200}],['Esfera Escarlate','bolt',{dice:12,area:2,cooldown:6500,mana:16}],['Dilúvio Rubro','tempest',{dice:10,area:3,cooldown:13000,mana:27}],['Rosa da Aniquilação','tempest',{dice:16,area:5,cooldown:26000,mana:40}],['Prisão do Véu','frost',{dice:6,rootMs:1600,area:2,mana:15}],['Sifão Espectral','drain',{dice:14,leech:.6,cooldown:9500}],['Espelho Carmesim','guard',{shieldScale:1.5,cooldown:22000,mana:25,energy:0}],['Centelha Sombria','bolt',{dice:10,speed:20,range:12,cooldown:4500}],['Estrela Faminta','drain',{dice:16,range:11,leech:.4,cooldown:11000}],['Eclipse de Sangue','tempest',{dice:15,rootMs:1400,area:4,cooldown:24000,mana:38}]],
 werewolf_exile:[['Garra Crescente','cleave',{dice:8,area:0,range:4,energy:10,cooldown:2600}],['Rasgo Selvagem','cleave',{dice:12,energy:17,leech:.1}],['Presas Cruzadas','cleave',{dice:15,area:0,leech:.25,cooldown:7000}],['Devorar a Lua','cleave',{dice:22,execute:.45,energy:32,cooldown:18000}],['Rugido de Caça','frost',{dice:6,range:5,area:2,rootMs:1200,mana:0,energy:18}],['Turbilhão de Garras','cleave',{dice:14,area:4,range:6,cooldown:8500,energy:25}],['Fúria Primordial','cleave',{dice:18,area:5,staggerMs:1000,cooldown:21000,energy:35}],['Pele de Ferro','guard',{shieldScale:.9,cooldown:12000}],['Instinto Vital','mend',{healDice:9,mana:12,energy:12,cooldown:14000}],['Juízo do Alfa','cleave',{dice:18,area:3,rootMs:1800,cooldown:23000,energy:28}]],
 werewolf_keeper:[['Golpe de Granito','cleave',{dice:8,area:0,energy:10,cooldown:3000}],['Couro de Rocha','guard',{shieldScale:1.3,cooldown:13000}],['Casca Ancestral','guard',{shieldScale:1.7,cooldown:19000,mana:10}],['Montanha Viva','guard',{shieldScale:2.3,cooldown:28000,mana:22}],['Laço de Raízes','frost',{dice:6,rootMs:1600,area:2,mana:15}],['Espinhos da Vigília','frost',{dice:11,rootMs:2200,area:3}],['Floresta Indomável','tempest',{dice:11,rootMs:2800,area:4,cooldown:24000}],['Fôlego da Matilha','mend',{healDice:6,mana:12,cooldown:12000}],['Presas Protetoras','cleave',{dice:12,leech:.65,cooldown:11000}],['Coração da Alcateia','mend',{healDice:17,cooldown:27000,mana:34}]],
 werewolf_wanderer:[['Faísca Lunar','bolt',{dice:8,mana:7,cooldown:2300}],['Disco da Lua','bolt',{dice:12,area:2,speed:16,cooldown:6500,mana:17}],['Maré Prateada','drain',{dice:14,leech:.5,cooldown:10000}],['Lua Plena','tempest',{dice:15,area:5,cooldown:26000,mana:39}],['Cristal de Inverno','frost',{dice:6,rootMs:1700,area:2,mana:15}],['Sopro Glacial','frost',{dice:11,rootMs:2400,area:3}],['Noite Polar','tempest',{dice:12,rootMs:2800,area:4,cooldown:25000}],['Raio Errante','bolt',{dice:11,speed:22,range:12,cooldown:5000}],['Vendaval Astral','bolt',{dice:14,area:3,staggerMs:650,cooldown:11000,mana:24}],['Tempestade do Eclipse','tempest',{dice:16,area:4,staggerMs:1100,cooldown:26000,mana:40}]]
};
export const CLASS_SKILLS={};
export const TREE_NODES={};
const passiveStats=[['weapon',2,'Gume treinado','+2 poder físico'],['maxHp',12,'Tenacidade','+12 vida máxima'],['defense',1,'Postura firme','+1 defesa'],['maxMana',10,'Reserva interior','+10 mana máxima'],['magicMastery',2,'Ritual profundo','+2 dano mágico'],['guardMastery',8,'Guarda ancestral','+8 absorção da guarda']];
for(const c of Object.values(REALM_CLASSES)){
 const nodes=[];
 skills[c.id].forEach(([name,base,mods],index)=>{
  const branch=index?Math.floor((index-1)/3):-1,step=index?(index-1)%3:0,id=`${c.id}_${index}`,level=index?[3,8,16][step]:1,cost=index?[1,2,3][step]:0;
  CLASS_SKILLS[id]={id,name,base,...mods,classId:c.id,faction:c.faction,iconIndex:c.art+index,level};
  nodes.push({id,name,ability:id,branch,row:index?step*2+1:0,level,cost,requires:index?[step===0?`${c.id}_0`:`${c.id}_passive_${branch*2+step-1}`]:[],iconIndex:c.art+index});
 });
 for(let index=0;index<6;index++){
  const branch=Math.floor(index/2),step=index%2,[stat,value,name,text]=passiveStats[index];
  nodes.push({id:`${c.id}_passive_${index}`,name,text,stat,value,branch,row:step*2+2,level:step?11:5,cost:1,requires:[`${c.id}_${1+branch*3+step}`],iconIndex:c.art+1+branch*3+step});
 }
 TREE_NODES[c.id]=nodes;
}
export const classFor=(faction,origin)=>REALM_CLASSES[`${faction==='werewolf'?'werewolf':'vampire'}_${['exile','keeper','wanderer'].includes(origin)?origin:'exile'}`];
export const classIcon=(faction,index)=>`/assets/world/skill-trees/${faction}-${index}.webp`;
export function buildClassAbilities(base){return Object.fromEntries(Object.values(CLASS_SKILLS).map(s=>{const a={...base[s.base],...s,effect:s.base,rootMs:s.rootMs??(s.base==='frost'?2000:0),leech:s.leech??(s.base==='drain'?.5:0),diceCount:s.base==='tempest'?2:1,key:''};a.text=skillDescription(a);return [a.id,a];}));}
function skillDescription(a){
 if(a.base==='guard')return `Barreira frontal: ${Math.round((a.shieldScale||1)*100)}% da guarda básica, por 3 s.`;
 if(a.base==='mend')return `Recupera 2d${a.healDice||8} + Percepção + nível de vida.`;
 return `${a.damageType==='physical'?'Golpe físico':'Projétil mágico'} de ${a.diceCount}d${a.dice}${a.area?` em área de ${a.area}`:''}.${a.rootMs?` Imobiliza por ${a.rootMs/1000}s se o alvo não resistir.`:''}${a.leech?` Recupera ${Math.round(a.leech*100)}% do dano como vida.`:''}${a.execute?` +${Math.round(a.execute*100)}% de dano contra alvos abaixo de 30% de vida.`:''}${a.staggerMs?` Interrompe por ${a.staggerMs/1000}s.`:''}`;
}
export function ensureSkillTree(p){
 const r=p.rpg;if(!r)return null;
 if(!r.skillTree){const origin=p.character?.origin||({hunter:'exile',scholar:'wanderer',diplomat:'exile',exile:'keeper'})[r.origin]||'exile',c=classFor(p.starterFaction,origin);r.skillTree={version:1,classId:c.id,learned:[],spent:0};}
 const t=r.skillTree,c=REALM_CLASSES[t.classId];
 if(!c||c.faction!==(p.starterFaction==='werewolf'?'werewolf':'vampire')){t.classId=classFor(p.starterFaction,p.character?.origin).id;t.learned=[];}
 t.learned=[...new Set((t.learned||[]).filter(id=>TREE_NODES[t.classId].some(n=>n.id===id&&n.cost>0)))];
 t.spent=TREE_NODES[t.classId].filter(n=>t.learned.includes(n.id)).reduce((n,node)=>n+node.cost,0);return t;
}
export function knowsClassSkill(p,id){const s=CLASS_SKILLS[id],t=ensureSkillTree(p);return !!s&&t.classId===s.classId&&p.rpg.level>=s.level&&(id===`${t.classId}_0`||t.learned.includes(id));}
export function treeBonus(p,stat){const t=ensureSkillTree(p);return TREE_NODES[t.classId].filter(n=>n.stat===stat&&t.learned.includes(n.id)).reduce((n,node)=>n+node.value,0);}
export function skillTreeView(p){const t=ensureSkillTree(p),points=Math.max(0,p.rpg.level-1-t.spent),root=`${t.classId}_0`;return {...t,points,maxPoints:19,class:REALM_CLASSES[t.classId],classes:Object.values(REALM_CLASSES).filter(c=>c.faction===REALM_CLASSES[t.classId].faction),nodes:TREE_NODES[t.classId].map(n=>({...n,learned:n.id===root||t.learned.includes(n.id),available:p.rpg.level>=n.level&&points>=n.cost&&n.requires.every(id=>id===root||t.learned.includes(id))}))};}
export function skillTreeChoice(p,input,now){
 const r=p.rpg,t=ensureSkillTree(p),check=(v,m)=>{if(!v)throw new RuleError(m);};
 check(now-(p.realm?.roaming?.lastCombatAt||0)>12000,'Afaste-se do combate por 12 segundos para alterar sua árvore.');
 if(input.type==='rpg-tree-learn'){
  const n=TREE_NODES[t.classId].find(n=>n.id===input.nodeId),view=skillTreeView(p);
  check(n&&n.cost>0&&!t.learned.includes(n.id),'Talento indisponível ou já aprendido.');check(view.nodes.find(v=>v.id===n.id).available,'Cumpra os requisitos de nível, caminho e pontos.');t.learned.push(n.id);t.spent+=n.cost;
 }else{
  const next=input.type==='rpg-class-change'?REALM_CLASSES[input.classId]:REALM_CLASSES[t.classId];check(next&&next.faction===REALM_CLASSES[t.classId].faction,'Classe de outra linhagem.');
  const cost=r.level===1&&!t.spent?0:input.type==='rpg-class-change'?200:100;check((p.coins||0)>=cost,`São necessárias ${cost} Marcas.`);p.coins-=cost;
  t.classId=next.id;t.learned=[];t.spent=0;r.loadout=[`${next.id}_0`,'bolt','guard','mend'];r.presets={};p.character={...p.character,origin:next.origin};
 }
 return {message:'Árvore de classe atualizada.'};
}
