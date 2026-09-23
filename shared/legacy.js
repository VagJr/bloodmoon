import {RuleError} from './engine.js';
export const FEATS=[
 {id:'roads',name:'Cartógrafo da Névoa',stat:'visits',goals:[5,10,15],icon:'◈'},
 {id:'victories',name:'Vigília de Véspera',stat:'wins',goals:[5,15,30],icon:'⚔'},
 {id:'delver',name:'Voz dos Sepulcros',stat:'dungeons',goals:[1,3,8],icon:'✦'},
 {id:'gatherer',name:'Sustento do Reino',stat:'gathers',goals:[10,30,60],icon:'⚒'}
];
export const PATHS={court:{name:'Emissário da Corte',text:'Vença expedições conquistando a Corte.',icon:'♜'},crypt:{name:'Guardião das Reservas',text:'Vença expedições conquistando Catacumbas.',icon:'⚒'},hunt:{name:'Sentinela da Fronteira',text:'Vença expedições conquistando a Caçada.',icon:'⚔'}};
export function legacyState(r){return r.adventure.legacy||{claimed:[],cycles:{court:0,crypt:0,hunt:0}};}
export function featValue(r,stat){return stat==='visits'?r.visited.length:r.adventure.stats[stat]||0;}
export function legacyClaim(r,id){const state=r.adventure.legacy||={claimed:[],cycles:{court:0,crypt:0,hunt:0}};
 for(const feat of FEATS)for(let tier=0;tier<feat.goals.length;tier++)if(id===feat.id+'-'+tier){if(state.claimed.includes(id)||featValue(r,feat.stat)<feat.goals[tier])throw new RuleError('Conquista ainda indisponível ou já recebida.');state.claimed.push(id);return {name:feat.name+' · '+(tier+1),coins:30+20*tier,scrap:5+5*tier};}
 if(Object.hasOwn(PATHS,id)){const cycle=state.cycles[id]||0,goal=(cycle+1)*5;if((r.adventure.stats.fronts?.[id]||0)<goal)throw new RuleError('Conclua mais expedições nesta especialidade.');state.cycles[id]=cycle+1;return {name:PATHS[id].name+' · Juramento '+(cycle+1),coins:40,scrap:8};}
 throw new RuleError('Conquista desconhecida.');
}
