// Persistent reputation for open-world action combat. No Arena state is involved.
export const KARMA_RANKS=Object.freeze([
  {id:'white',score:0,color:'#edf2ff',vampire:'Neófito do Véu',werewolf:'Cria da Lua'},
  {id:'red',score:60,color:'#f24f65',vampire:'Predador Carmesim',werewolf:'Garra Rubra'},
  {id:'black',score:240,color:'#98748e',vampire:'Senhor da Noite',werewolf:'Sombra da Matilha'},
  {id:'gold',score:700,color:'#f0c877',vampire:'Soberano do Eclipse',werewolf:'Alfa do Eclipse'}
]);
export const PK_RANKS=Object.freeze([
  {murders:0,name:'Sem marca'},
  {murders:1,name:'Proscrito'},
  {murders:3,name:'Caçado'},
  {murders:8,name:'Flagelo'},
  {murders:20,name:'Lenda Negra'}
]);
const lineage=profile=>profile.starterFaction==='werewolf'?'werewolf':'vampire';
const rankFor=score=>KARMA_RANKS.findLast(rank=>score>=rank.score)||KARMA_RANKS[0];
export const karmaIcon=(faction,rank)=>`/assets/world/sheet-details/${faction==='werewolf'?'werewolf':'vampire'}-${rank}.webp`;

export function ensureKarma(profile){
 const realm=profile.realm||(profile.realm={});
 if(!realm.karma)realm.karma={score:0,creatureKills:0,eliteKills:0,bossKills:0,playerKills:0,murders:0,deaths:0,streak:0,bounty:0,wantedUntil:0,pkMode:false,lastVictims:{},lastKillAt:0};
 return realm.karma;
}
export function karmaView(profile,now=Date.now()){
 const k=ensureKarma(profile),faction=lineage(profile),rank=rankFor(k.score),index=KARMA_RANKS.indexOf(rank),next=KARMA_RANKS[index+1],pk=PK_RANKS.findLast(t=>k.murders>=t.murders);
 return {faction,rank:rank.id,title:rank[faction],icon:karmaIcon(faction,rank.id),color:rank.color,score:k.score,nextScore:next?.score||null,progress:next?Math.min(1,(k.score-rank.score)/(next.score-rank.score)):1,creatureKills:k.creatureKills,eliteKills:k.eliteKills,bossKills:k.bossKills,playerKills:k.playerKills,murders:k.murders,deaths:k.deaths,streak:k.streak,bounty:k.bounty,pkLevel:PK_RANKS.indexOf(pk),pkTitle:pk.name,pkMode:!!k.pkMode,wanted:k.wantedUntil>now,wantedUntil:k.wantedUntil,lastKillAt:k.lastKillAt};
}
export function recordCreatureKill(profile,actor,now=Date.now()){
 const k=ensureKarma(profile),boss=actor.kind==='raid'||actor.kind==='boss',elite=boss||actor.kind==='invader'||(actor.level||1)>=6;
 k.creatureKills++;if(boss)k.bossKills++;else if(elite)k.eliteKills++;
 k.streak++;k.score+=Math.max(4,Math.min(20,Math.ceil((actor.level||1)*1.5)))+(boss?50:elite?12:0);
 k.lastKillAt=now;return karmaView(profile,now);
}
export function recordDeath(profile){const k=ensureKarma(profile);k.deaths++;k.streak=0;}
export function recordPlayerKill(killer,victim,now=Date.now(),{war=false}={}){
 const attacker=ensureKarma(killer),fallen=ensureKarma(victim);
 const lawful=war||fallen.pkMode||fallen.wantedUntil>now;
 recordDeath(victim);
 const prior=attacker.lastVictims[victim.id]||0;
 if(now-prior<300000)return {awarded:false,lawful,rank:karmaView(killer,now)};
 attacker.lastVictims[victim.id]=now;
 for(const [id,time]of Object.entries(attacker.lastVictims))if(now-time>1800000)delete attacker.lastVictims[id];
 attacker.playerKills++;attacker.streak++;attacker.lastKillAt=now;
 attacker.score+=lawful?(fallen.wantedUntil>now?55:40):70;
 let bountyClaimed=0;
 if(lawful&&fallen.bounty){bountyClaimed=Math.min(60,fallen.bounty);killer.coins=(killer.coins||0)+bountyClaimed;fallen.bounty=Math.max(0,fallen.bounty-bountyClaimed);if(!fallen.bounty){fallen.wantedUntil=0;fallen.pkMode=false;}}
 if(!lawful){attacker.murders++;attacker.bounty+=20+Math.min(80,attacker.murders*5);attacker.wantedUntil=now+1800000;attacker.pkMode=true;}
 return {awarded:true,lawful,bountyClaimed,rank:karmaView(killer,now)};
}
export function canAttackPlayer(world,attacker,victim,now=Date.now()){
 if(attacker===victim||!attacker?.realm||!victim?.realm)return false;
 const a=ensureKarma(attacker),v=ensureKarma(victim);
 const war=attacker.realm.houseId&&victim.realm.houseId&&attacker.realm.houseId!==victim.realm.houseId&&(world.warPairs||[]).some(pair=>pair.includes(attacker.realm.houseId)&&pair.includes(victim.realm.houseId));
 return !!(war||a.pkMode||v.pkMode||v.wantedUntil>now);
}
