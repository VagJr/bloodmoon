import {RuleError} from './engine.js';

export const LIFE_TALENTS=Object.freeze({
 edge:{name:'Gume paciente',branch:'combate',requires:[],mastery:4,max:3,text:'Cada grau acrescenta 1 de dano físico quando uma arma treinada está equipada.'},
 channel:{name:'Ritual repetido',branch:'combate',requires:[],mastery:4,max:3,text:'Cada grau acrescenta 1 de dano mágico após treinar feitiços.'},
 brace:{name:'Postura de ferro',branch:'combate',requires:['edge'],mastery:13,max:2,text:'Guarda ganha 3 de durabilidade por grau.'},
 keen:{name:'Leitura do golpe',branch:'combate',requires:['channel'],mastery:13,max:2,text:'Aparar e refletir ganham uma pequena janela de prática por grau.'},
 forager:{name:'Olho do coletor',branch:'oficio',requires:[],mastery:4,max:3,text:'Uma unidade extra a cada grau em fontes mais ricas.'},
 artisan:{name:'Mão de artesão',branch:'oficio',requires:['forager'],mastery:13,max:2,text:'Reparos custam menos Marcas após muitas coletas e usos de equipamento.'},
 provisioner:{name:'Mesa da fronteira',branch:'dominio',requires:['forager'],mastery:25,max:2,text:'Produção de provisões da matilha e abastecimento de Casa recebem um bônus.'},
 veteran:{name:'Juramento veterano',branch:'dominio',requires:['brace','artisan'],mastery:42,max:1,text:'Aumenta um pouco a reserva de vigor para expedições finais.'}
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const skillThreshold=level=>80*(level-1)*(level-1)+100*(level-1);
export function ensureLifeSkills(p){const r=p.rpg;r.lifeSkills||={gathering:{},abilities:{},equipment:{},talents:{},usedAt:{}};for(const key of ['gathering','abilities','equipment','talents','usedAt'])r.lifeSkills[key]||={};return r.lifeSkills;}
export function skillLevel(xp){let level=1;while(level<40&&xp>=skillThreshold(level+1))level++;return level;}
const groups={gathering:'gathering',ability:'abilities',equipment:'equipment'};
export function gainLifeSkill(p,kind,id,now,amount=3){
 const s=ensureLifeSkills(p),group=groups[kind];if(!group||typeof id!=='string'||!id||id.length>60)return false;
 const key=group+':'+id,interval=kind==='gathering'?1100:kind==='ability'?420:900;
 if(now-(s.usedAt[key]||0)<interval)return false;
 s.usedAt[key]=now;const prior=s[group][id]||0;s[group][id]=prior+clamp(Math.floor(amount),1,16);return skillLevel(prior)!==skillLevel(s[group][id]);
}
export function lifeSkillView(p){
 const s=ensureLifeSkills(p),map=group=>Object.entries(s[group]).map(([id,xp])=>({id,xp,level:skillLevel(xp),next:skillThreshold(Math.min(40,skillLevel(xp)+1)),max:skillLevel(xp)>=40})),skills={gathering:map('gathering'),abilities:map('abilities'),equipment:map('equipment')};
 const mastery=Object.values(skills).flat().reduce((sum,a)=>sum+a.level-1,0),spent=Object.values(s.talents).reduce((sum,n)=>sum+n,0),insight=Math.floor(mastery/4);
 return {skills,mastery,insight:Math.max(0,insight-spent),talents:{...s.talents},definitions:LIFE_TALENTS,stage:mastery>=42?'lendário':mastery>=18?'veterano':'aprendiz'};
}
export function lifeTalentChoice(p,id){
 const t=LIFE_TALENTS[id];if(!t)throw new RuleError('Talento de ofício desconhecido.');const s=ensureLifeSkills(p),view=lifeSkillView(p);
 if(view.mastery<t.mastery||view.insight<1||t.requires.some(needed=>!(s.talents[needed]>0))||(s.talents[id]||0)>=t.max)throw new RuleError('Este talento exige mais prática, pontos ou um pré-requisito.');
 s.talents[id]=(s.talents[id]||0)+1;return {message:`Talento de vida aprendido: ${t.name}.`};
}
