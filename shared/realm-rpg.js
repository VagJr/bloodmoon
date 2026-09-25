import {CARDS} from './cards.js';
import {RuleError} from './engine.js';

export const ATTRIBUTES={strength:'Força',dexterity:'Destreza',constitution:'Vigor',intelligence:'Intelecto',wisdom:'Percepção',charisma:'Presença'};
export const PATHS={sentinel:{name:'Sentinela',attribute:'strength',text:'Aço e resistência: +2 Força, guarda reforçada.'},stalker:{name:'Predador',attribute:'dexterity',text:'Precisão e mobilidade: +2 Destreza, críticos ferem mais.'},arcanist:{name:'Teurgista',attribute:'intelligence',text:'Rituais do Véu: +2 Intelecto, +20 mana.'}};
export const ABILITIES={
 strike:{id:'strike',name:'Corte',icon:'⚔',key:'Espaço',level:1,cooldown:650,energy:0,mana:0,range:4.5,dice:6,attribute:'strength',text:'Golpe rápido. O terceiro acerto seguido ganha +4 dano.'},
 cleave:{id:'cleave',name:'Arco de aço',icon:'◒',key:'1',level:1,cooldown:4200,energy:16,mana:0,range:5,dice:10,attribute:'strength',area:3,text:'Golpe em leque. Atinge até cinco inimigos na direção da mira.'},
 bolt:{id:'bolt',name:'Lança do Véu',icon:'✦',key:'2',level:1,cooldown:1700,energy:0,mana:9,range:11,dice:10,attribute:'intelligence',text:'Projétil arcano. Alcance longo; testa a defesa do alvo.'},
 dash:{id:'dash',name:'Passo espectral',icon:'➶',key:'Shift',level:1,cooldown:3200,energy:12,mana:0,range:3.8,text:'Esquiva na direção do movimento ou da mira. Evita golpes por 500 ms.'},
 guard:{id:'guard',name:'Guarda de ferro',icon:'⬡',key:'3',level:1,cooldown:8000,energy:10,mana:0,range:0,text:'Por 3 s: +5 defesa e metade do dano recebido.'},
 mend:{id:'mend',name:'Sangue renovado',icon:'♥',key:'4',level:2,cooldown:10000,energy:0,mana:18,range:0,text:'Recupera 2d8 + Percepção + nível de vida.'},
 frost:{id:'frost',name:'Círculo lunar',icon:'❄',key:'5',level:3,cooldown:8000,energy:0,mana:22,range:9,dice:8,attribute:'wisdom',area:4,save:true,text:'Explosão de gelo: resistência de Destreza reduz o dano. Imobiliza por 2 s.'},
 drain:{id:'drain',name:'Pacto carmesim',icon:'◈',key:'6',level:4,cooldown:6500,energy:0,mana:17,range:8,dice:12,attribute:'charisma',text:'Drena metade do dano causado como vida.'},
 tempest:{id:'tempest',name:'Eclipse',icon:'☽',key:'7',level:6,cooldown:16000,energy:10,mana:35,range:10,dice:12,attribute:'intelligence',area:5,save:true,text:'Tempestade do Véu: 2d12 em área. Resistência de Destreza reduz à metade.'}
};
export const TALENTS={vitality:{name:'Sangue ancestral',text:'+12 vida máxima por grau.',max:3},precision:{name:'Lâmina certeira',text:'+1 nos ataques d20 por grau.',max:3},channel:{name:'Canalização',text:'+8 mana e +1 dano mágico por grau.',max:3},steward:{name:'Regente',text:'+1 produção por grau nas ordens de abastecimento.',max:3}};
export const modifier=value=>Math.floor((value-10)/2);
export const levelThreshold=level=>100*(level-1)*level;
export function ensureRpg(p){
 if(!p.rpg)p.rpg={schema:1,xp:Math.max(0,Math.floor((p.xp||0)*.2)),path:null,attributes:{strength:12,dexterity:12,constitution:12,intelligence:12,wisdom:12,charisma:12},spent:0,talents:{},cooldowns:{},mana:50,combo:0,comboAt:0,stats:{kills:0,raids:0,arena:0,duels:0,dungeons:0,gathers:0},claims:[],loadout:['cleave','bolt','guard','mend'],log:[]};
 const r=p.rpg;r.level=1;while(r.level<20&&r.xp>=levelThreshold(r.level+1))r.level++;return r;
}
export function rpgStats(p){const r=ensureRpg(p),a={...r.attributes};if(r.path)a[PATHS[r.path].attribute]+=2;const equipment=(p.realm?.roaming?.equipment||[]).filter(id=>(p.items||[]).some(i=>i.cardId===id&&i.durability>0&&!i.listingId&&!i.lockedBy));const gear=equipment.map(id=>CARDS[id]).filter(Boolean);return {attributes:a,modifiers:Object.fromEntries(Object.entries(a).map(([k,v])=>[k,modifier(v)])),proficiency:2+Math.floor((r.level-1)/4),defense:10+modifier(a.dexterity)+(p.campaign?.projects.bastion||0)+Math.min(4,gear.reduce((n,c)=>n+(c.health||0),0)),maxHp:100+(r.level-1)*7+Math.max(0,modifier(a.constitution)-1)*5+(r.talents.vitality||0)*12+gear.reduce((n,c)=>n+(c.health||0)*5,0),maxMana:50+(r.level-1)*4+(r.path==='arcanist'?20:0)+(r.talents.channel||0)*8,weapon:gear.reduce((n,c)=>n+(c.attack||0)*2,0),equipment};}
export function gainRpg(p,amount,source){const r=ensureRpg(p);r.xp+=Math.max(0,Math.floor(amount));if(source&&source in r.stats)r.stats[source]++;ensureRpg(p);return r;}
export function rollD20(bonus,defense,rng=Math.random,advantage=0){const first=1+Math.floor(rng()*20),second=advantage?1+Math.floor(rng()*20):first,natural=advantage>0?Math.max(first,second):advantage<0?Math.min(first,second):first;return {natural,total:natural+bonus,defense,critical:natural===20,hit:natural===20||(natural!==1&&natural+bonus>=defense),rolls:advantage?[first,second]:[first]};}
export function rollDice(count,sides,rng=Math.random){let n=0;for(let i=0;i<count;i++)n+=1+Math.floor(rng()*sides);return n;}
export function rpgView(p,now){const r=ensureRpg(p),stats=rpgStats(p);return {...structuredClone(r),...stats,faction:p.starterFaction,nextXP:levelThreshold(r.level+1),startXP:levelThreshold(r.level),points:Math.max(0,(r.level-1)*2-r.spent),talentPoints:Math.max(0,Math.floor(r.level/2)-Object.values(r.talents).reduce((a,b)=>a+b,0)),abilities:Object.values(ABILITIES).map(a=>({...a,unlocked:r.level>=a.level,remaining:Math.max(0,(r.cooldowns[a.id]||0)-now)})),paths:PATHS,talentDefinitions:TALENTS,attributeNames:ATTRIBUTES};}
export function rpgChoice(p,input){const r=ensureRpg(p);const check=(v,m)=>{if(!v)throw new RuleError(m);};
 if(input.type==='rpg-path'){check(!r.path&&PATHS[input.path],'Escolha uma vocação disponível; o juramento é permanente.');r.path=input.path;}
 else if(input.type==='rpg-attribute'){check(ATTRIBUTES[input.attribute]&&r.attributes[input.attribute]<20&&r.spent<(r.level-1)*2,'Não há pontos disponíveis para este atributo.');r.attributes[input.attribute]++;r.spent++;}
 else if(input.type==='rpg-talent'){const t=TALENTS[input.talent];check(t&&(r.talents[input.talent]||0)<t.max&&Object.values(r.talents).reduce((a,b)=>a+b,0)<Math.floor(r.level/2),'Talento indisponível ou sem pontos.');r.talents[input.talent]=(r.talents[input.talent]||0)+1;}
 else if(input.type==='rpg-loadout'){const a=ABILITIES[input.ability];check(Number.isInteger(input.slot)&&input.slot>=0&&input.slot<4&&a&&r.level>=a.level&&!['strike','dash'].includes(a.id),'Habilidade ou posição indisponível.');const previous=r.loadout.indexOf(a.id);if(previous>=0)r.loadout[previous]=r.loadout[input.slot];r.loadout[input.slot]=a.id;}
 else throw new RuleError('Escolha de personagem desconhecida.');return {message:'Ficha de personagem atualizada.'};
}
