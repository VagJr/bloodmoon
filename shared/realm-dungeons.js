import {RuleError} from './engine.js';
import {gainRpg,ensureRpg} from './realm-rpg.js';
import {lifeSkillView} from './realm-life-skills.js';
import {wearRealmGear} from './realm-loot.js';

const check=(okay,message)=>{if(!okay)throw new RuleError(message);};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.65,a.y-b.y);
const alive=a=>a.hp>0;
const presets={
 blood:{id:'blood',name:'Cripta da Lua Rubra',image:'/assets/world/dungeons/blood-crypt.png',creatures:['Devota da Cripta','Guardião Sanguíneo','Carrasco da Lua Rubra'],hazard:'Sangue fervente',tint:'#f36b69'},
 moon:{id:'moon',name:'Templo do Reflexo',image:'/assets/world/dungeons/moon-temple.png',creatures:['Eco Encharcado','Vigia do Altar','Oráculo da Lua Submersa'],hazard:'Maré lunar',tint:'#90d7f4'},
 forge:{id:'forge',name:'Forja dos Condenados',image:'/assets/world/dungeons/obsidian-forge.png',creatures:['Forjado Errante','Sentinela de Ferro','Titã do Crisol'],hazard:'Pulso de magma',tint:'#ff9b62'}
};
export function dungeonPreset(region){
 if(region.habitat==='volcanic'||region.habitat==='mountain'||/forge|pyre|obsidian|iron/i.test(region.id))return presets.forge;
 if(['marsh','snow','forest'].includes(region.habitat)||/glass|moon|ice|white/i.test(region.id))return presets.moon;
 return presets.blood;
}
function createDungeon(region,now){
 const theme=dungeonPreset(region),level=region.recommendedLevel||region.level||1;
 const positions=[{x:31,y:55},{x:47,y:44},{x:61,y:55},{x:81,y:37}];
 return {id:region.id,theme:theme.id,level,openedAt:now,resetAt:now+20*60000,revision:1,events:[],sigils:[{id:'west',x:42,y:61,active:false},{id:'east',x:66,y:59,active:false}],chests:[{id:'entry',x:24,y:43,claimed:{}},{id:'secret',x:56,y:76,claimed:{},secret:true},{id:'sanctum',x:88,y:54,claimed:{},boss:true}],hazards:[{x:39,y:54},{x:70,y:46}],enemies:positions.map((pos,i)=>({id:`${region.id}-d${i}`,name:theme.creatures[Math.min(2,i===3?2:i%2)],x:pos.x,y:pos.y,homeX:pos.x,homeY:pos.y,hp:Math.ceil((i===3?260:52)+level*(i===3?18:7)),maxHp:Math.ceil((i===3?260:52)+level*(i===3?18:7)),damage:Math.ceil((i===3?8:4)+level*(i===3?1.7:1.1)),boss:i===3,phase:1,attackAt:now+1200+i*350,windup:null,staggerUntil:0}))};
}
function event(d,kind,text,now,at){d.events.unshift({id:`${d.id}-${++d.revision}`,kind,text,at:now,x:at?.x||50,y:at?.y||50});d.events=d.events.slice(0,14);}
function advanceBossPhase(d,boss,now){
 const desired=boss.hp<=boss.maxHp*.35&&d.level>=17?3:boss.hp<=boss.maxHp*.7?2:1;
 if(desired<=(boss.phase||1)||boss.hp<=0)return;
 for(let phase=(boss.phase||1)+1;phase<=desired;phase++){
  boss.phase=phase;
  const name=d.theme==='blood'?'Pacto carmesim':d.theme==='moon'?'Maré do espelho':'Crisol desperto';
  event(d,'phase',`${boss.name}: ${name}, fase ${phase}. Procure cobertura e prepare a defesa.`,now,boss);
  const x=phase===2?73:78,y=phase===2?63:48;
  d.hazards.push({x,y,phase});
  if(d.level>=12){const hp=40+d.level*6;d.enemies.push({id:`${d.id}-reinforcement-${phase}`,name:d.theme==='forge'?'Sentinela de escória':d.theme==='moon'?'Reflexo lunar':'Servo do pacto',x:phase===2?66:85,y:phase===2?64:58,homeX:x,homeY:y,hp,maxHp:hp,damage:5+Math.floor(d.level*.85),boss:false,attackAt:now+1500,windup:null,staggerUntil:0});}
 }
}
export function enterDungeon(w,p,portal,region,now,profiles=[]){
 check(portal?.arenaKind==='dungeon'&&portal.hp>0,'Entrada de dungeon indisponível.');
 check(distance(p.realm.roaming,portal)<=4.2,'Aproxime-se da entrada da dungeon.');
 check(!p.realm.roaming.dungeon,'Saia da dungeon atual primeiro.');
 const level=region.recommendedLevel||region.level||1,rpg=ensureRpg(p),requiredLevel=level>=17?Math.ceil(level*.75):level>=9?Math.ceil(level*.45):1,requiredMastery=level>=17?16+(level-17)*4:level>=9?4+Math.floor((level-9)*.7):0;
 check(rpg.level>=requiredLevel&&lifeSkillView(p).mastery>=requiredMastery,`Esta expedição exige personagem nível ${requiredLevel} e ${requiredMastery} graus de maestria. Treine no mundo antes de entrar.`);
 w.dungeons||={};let d=w.dungeons[region.id];
 if(!d||(d.resetAt<=now&&!profiles.some(other=>other.realm?.roaming?.dungeon?.id===region.id&&other.realm.roaming.hp>0)))d=w.dungeons[region.id]=createDungeon(region,now);
 const s=p.realm.roaming;s.dungeon={id:region.id,x:15,y:68,moveAt:now-150,attackAt:0,guardUntil:0,evadeUntil:0};s.harvest=null;s.targetId=null;p.realm.seenAt=now;
 event(d,'entry',`${p.name} cruzou o limiar.`,now,s.dungeon);
 return {message:`${dungeonPreset(region).name}: expedição compartilhada iniciada. Saia pela porta quando quiser.`};
}
export function dungeonAction(w,p,input,now,profiles=[]){
 const s=p.realm.roaming,inside=s.dungeon,d=inside&&w.dungeons?.[inside.id];check(d&&s.hp>0,'Entre em uma dungeon primeiro.');
 const id=p.realm.publicId;
 if(input.type==='world-dungeon-exit'){s.dungeon=null;event(d,'exit',`${p.name} deixou as câmaras.`,now,inside);return {message:'Você retornou à entrada da dungeon.'};}
 if(input.type==='world-dungeon-move'){
  const dx=Number(input.dx),dy=Number(input.dy),elapsed=Number(input.elapsedMs);
  check(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)<=1&&Math.abs(dy)<=1&&Number.isFinite(elapsed)&&elapsed>0&&elapsed<=400,'Movimento inválido.');
  const ms=clamp(Math.min(elapsed,now-inside.moveAt),0,400);inside.moveAt=now;
  if(s.knockbackUntil>now)return {x:inside.x,y:inside.y};
  const length=Math.max(1,Math.hypot(dx,dy)),pace=11*ms/1000;
  inside.x=clamp(inside.x+dx/length*pace/1.65,8,91);inside.y=clamp(inside.y+dy/length*pace,22,79);
  return {x:inside.x,y:inside.y};
 }
 if(input.type==='world-dungeon-guard'){check(now>=inside.attackAt,'Aguarde a próxima ação.');inside.guardUntil=now+950;inside.attackAt=now+650;event(d,'guard',`${p.name} ergueu a guarda.`,now,inside);return {message:'Guarda erguida por 0,95 s.'};}
 if(input.type==='world-dungeon-dodge'){
  check(now>=inside.attackAt&&s.energy>=12,'Esquiva ainda indisponível ou vigor insuficiente.');
  const dx=clamp(Number(input.dx)||0,-1,1),dy=clamp(Number(input.dy)||0,-1,1),len=Math.max(.01,Math.hypot(dx,dy));
  inside.x=clamp(inside.x+dx/len*4,8,91);inside.y=clamp(inside.y+dy/len*6,22,79);inside.evadeUntil=now+650;inside.attackAt=now+850;s.energy-=12;
  event(d,'dodge',`${p.name} atravessou a ameaça.`,now,inside);return {message:'Esquiva.'};
 }
 if(input.type==='world-dungeon-attack'){
  check(now>=inside.attackAt,'Golpe em recarga.');
  const enemy=d.enemies.find(a=>a.id===input.targetId&&alive(a));
  const rival=profiles.find(a=>a.realm?.publicId===input.targetId&&a!==p&&a.realm.roaming?.dungeon?.id===inside.id&&a.realm.roaming.hp>0);
  check(enemy||rival,'Alvo indisponível.');
  const target=enemy||rival.realm.roaming.dungeon;check(distance(inside,target)<=(input.ability==='bolt'?19:8),'Alvo fora de alcance.');
  if(rival)check(!!p.karma?.pkMode||!!rival.karma?.pkMode,'O PvP na dungeon exige postura de caça livre.');
  if(enemy?.boss)check(d.sigils.every(g=>g.active),'Ative os dois selos para expor o guardião.');
  const bolt=input.ability==='bolt',cost=bolt?10:0;check(s.energy>=cost,'Vigor insuficiente.');s.energy-=cost;
  const roll=1+Math.floor(Math.random()*20),level=p.rpg?.level||p.realm.level||1,defense=enemy?(enemy.boss?15+Math.floor(enemy.maxHp/240):11+Math.floor(enemy.maxHp/130)):12+Math.floor((rival.rpg?.level||1)/4),hit=roll===20||roll!==1&&roll+2+Math.floor(level/3)>=defense;
  const damage=hit?(bolt?10:7)+Math.floor(level*.9)+(roll===20?8:0):0;
  if(enemy){enemy.hp=Math.max(0,enemy.hp-damage);if(damage)wearRealmGear(p,now);if(enemy.boss)advanceBossPhase(d,enemy,now);if(!enemy.hp){gainRpg(p,enemy.boss?120:24,enemy.boss?'dungeons':'kills',{targetLevel:d.level});if(enemy.boss){p.realm.xp=(p.realm.xp||0)+100;p.realm.level=1+Math.floor(p.realm.xp/120);event(d,'boss',`${p.name} derrubou ${enemy.name}. O cofre foi aberto para os participantes.`,now,enemy);}else event(d,'kill',`${p.name} venceu ${enemy.name}.`,now,enemy);}}
  else if(damage){rival.realm.roaming.hp=Math.max(0,rival.realm.roaming.hp-damage);rival.realm.roaming.lastCombatAt=now;rival.realm.roaming.killedBy=id;}
  inside.attackAt=now+(bolt?1150:730);s.lastCombatAt=now;
  event(d,hit?roll===20?'critical':'hit':'miss',`${p.name}: ${roll} no d20 · ${hit?damage+' de dano':'errou'}.`,now,target);
  return {message:`d20 ${roll} · ${hit?`acerto por ${damage}`:'erro'}.`,roll,damage};
 }
 if(input.type==='world-dungeon-interact'){
  const sigil=d.sigils.find(a=>a.id===input.targetId);
  if(sigil){check(distance(inside,sigil)<7,'Aproxime-se do selo.');check(!sigil.active,'Selo já ativo.');check(d.enemies.slice(0,3).filter(e=>!alive(e)).length>=2,'Vençam ao menos dois guardiões antes de ativar os selos.');sigil.active=true;event(d,'sigil',`${p.name} despertou um selo.`,now,sigil);return {message:'Selo ativado. O guardião perde sua proteção quando ambos despertarem.'};}
  const chest=d.chests.find(a=>a.id===input.targetId);check(chest,'Segredo desconhecido.');check(distance(inside,chest)<7,'Aproxime-se do tesouro.');check(!chest.claimed[id],'Você já recolheu este tesouro.');check(!chest.boss||!alive(d.enemies.find(e=>e.boss)),'Vença o guardião para abrir o cofre.');
  chest.claimed[id]=now;const coins=chest.boss?90:chest.secret?42:22,essence=chest.boss?7:chest.secret?4:2;p.coins=(p.coins||0)+coins;p.realm.materials.essence=(p.realm.materials.essence||0)+essence;gainRpg(p,chest.boss?80:30,'dungeons');
  event(d,'treasure',`${p.name} abriu ${chest.secret?'o relicário oculto':chest.boss?'o cofre do guardião':'um baú antigo'}.`,now,chest);
  return {message:`Tesouro: +${coins} Marcas, +${essence} essências e experiência.`};
 }
 throw new RuleError('Ação de dungeon desconhecida.');
}
export function advanceDungeons(w,profiles,now){
 if(!w.dungeons)return;
 for(const d of Object.values(w.dungeons)){
 const party=profiles.filter(p=>p.realm?.roaming?.dungeon?.id===d.id&&p.realm.roaming.hp>0&&now-(p.realm.seenAt||0)<45000);if(!party.length)continue;
  if(d.theme==='moon'&&d.level>=9&&now>=(d.nextTideAt||0)){d.nextTideAt=now+6000;for(const [i,h] of d.hazards.entries()){h.baseX??=h.x;h.x=clamp(h.baseX+(i%2?1:-1)*Math.sin(now/5000)*7,14,87);}event(d,'tide','A maré lunar deslocou as zonas de perigo.',now,{x:55,y:50});}
  for(const e of d.enemies){if(!alive(e))continue;
   const target=party.map(p=>({p,gap:distance(e,p.realm.roaming.dungeon)})).sort((a,b)=>a.gap-b.gap)[0];if(!target||target.gap>25)continue;
   if(e.boss&&!d.sigils.every(g=>g.active))continue;
   if(e.windup){if(now<e.windup.endsAt)continue;const omen=e.windup,victim=party.find(p=>p.realm.publicId===omen.targetId);e.windup=null;e.attackAt=now+(e.boss?Math.max(1450,2400-(e.phase||1)*220):1500);if(!victim)continue;
    const center=e.boss?{x:omen.x,y:omen.y}:e,radius=e.boss?(e.phase>=3?7.2:e.phase>=2?6:4.6):4.6;
    for(const struck of party){const state=struck.realm.roaming,inside=state.dungeon;if(!inside||distance(center,inside)>radius)continue;
     const evaded=inside.evadeUntil>now,blocked=inside.guardUntil>now,base=e.damage*(e.boss?e.phase>=3?1.5:e.phase>=2?1.2:1:1),damage=evaded?0:blocked?Math.ceil(base*.25):Math.ceil(base);
     state.hp=Math.max(0,state.hp-damage);state.lastCombatAt=now;if(damage)wearRealmGear(struck,now);
     if(e.boss&&d.theme==='blood'&&damage)e.hp=Math.min(e.maxHp,e.hp+Math.ceil(damage*.2));
     event(d,evaded?'dodge':blocked?'block':'enemy-hit',`${struck.name}: ${evaded?'esquivou':blocked?'bloqueou':'−'+damage+' vida'}${e.boss&&d.theme==='blood'&&damage?' · o pacto se alimenta':''}.`,now,inside);if(!state.hp)state.dungeon=null;
    }continue;}
   const reach=e.boss&&e.phase>=2?d.theme==='moon'?12:9:3.8;
   if(target.gap>reach){const step=Math.min(target.gap,e.boss?.65:.9),dx=(target.p.realm.roaming.dungeon.x-e.x)*1.65,dy=target.p.realm.roaming.dungeon.y-e.y;e.x=clamp(e.x+dx/target.gap*step/1.65,10,89);e.y=clamp(e.y+dy/target.gap*step,24,76);}
   else if(now>=e.attackAt){const victim=target.p.realm.roaming.dungeon;e.windup={targetId:target.p.realm.publicId,x:victim.x,y:victim.y,endsAt:now+(e.boss?Math.max(700,1150-(e.phase||1)*110):630)};event(d,'tell',`${e.name} prepara ${e.boss?d.theme==='moon'?'uma maré lunar':d.theme==='forge'?'uma ruptura de magma':'um pacto de sangue':'um golpe'}.`,now,{x:victim.x,y:victim.y});}
  }
  for(const p of party){const s=p.realm.roaming,inside=s.dungeon;if(!inside)continue;
   for(const [index,h] of d.hazards.entries())if(distance(inside,h)<(d.theme==='forge'?4.5:3.2)&&Math.floor(now/2600)!==Math.floor((now-250)/2600)&&inside.evadeUntil<=now){const damage=(index===0?5:7)+(d.theme==='forge'?(h.phase||0)*3:0);s.hp=Math.max(0,s.hp-damage);s.lastCombatAt=now;event(d,'hazard',`${p.name} sofreu ${damage} de dano ambiental.`,now,inside);if(!s.hp)s.dungeon=null;}
  }
 }
}
export function dungeonView(w,p,profiles,now){
 const inside=p.realm?.roaming?.dungeon,d=inside&&w.dungeons?.[inside.id];if(!d)return null;
 const theme=presets[d.theme];return {id:d.id,name:theme.name,level:d.level,tier:d.level>=17?'FIM DE JOGO':d.level>=9?'MEIO DE JOGO':'INÍCIO DE JOGO',image:theme.image,hazard:theme.hazard,tint:theme.tint,player:{...inside,hp:p.realm.roaming.hp,maxHp:p.realm.roaming.maxHp},players:profiles.filter(other=>other.realm?.roaming?.dungeon?.id===d.id&&other.realm.roaming.hp>0).map(other=>({id:other.realm.publicId,name:other.name,avatar:other.realm.avatar,x:other.realm.roaming.dungeon.x,y:other.realm.roaming.dungeon.y,hp:other.realm.roaming.hp,maxHp:other.realm.roaming.maxHp})),enemies:d.enemies.map(e=>({...e,windup:e.windup?{endsAt:e.windup.endsAt}:null})),sigils:d.sigils,chests:d.chests.map(c=>({...c,claimed:!!c.claimed[p.realm.publicId]})),hazards:d.hazards,events:d.events.slice(0,8),serverTime:now};
}
