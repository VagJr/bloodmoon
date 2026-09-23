import {createGame,applyAction,publicView} from '/shared/engine.js';
import {CARDS} from '/shared/cards.js';
export const LESSONS=[
 ['Seu primeiro aliado','Jogue o aliado da mão na Corte. Toque na carta e depois no campo; no PC, também pode arrastar. O custo usa Sangue ou Fúria.','play','unit','.hand-dock'],
 ['Armar um sobrevivente','Selecione o equipamento e depois seu aliado. Cada criatura aceita até dois itens. Neste treino, nada é consumido ou desgastado.','play','equipment','.hand-dock'],
 ['Escolher a presa','Selecione seu aliado e ataque a criatura rival da mesma frente. Há revide simultâneo: ataque e vida importam. Uma criatura ataca uma vez por rodada.','attack',null,'.player-squad'],
 ['O poder do líder','Use a habilidade ao lado do avatar e escolha o rival. Ela custa 2 recursos e pode ser usada uma vez por rodada.','skill',null,'.skill-button'],
 ['Política na Corte','Abra as ordens da Corte. Use Pacto de Fronteira e escolha a Corte: +2 poder de conquista, sem aumentar dano. Só uma ordem de cada frente por rodada.','campaign','bribe','.lane-court'],
 ['Linhas de suprimento','Nas Catacumbas, use Manobra Logística. Escolha seu aliado e outra frente. Feridas, itens e estado de ataque acompanham a criatura.','campaign','logistics','.lane-crypt'],
 ['Pressão de cerco','Na Caçada, use Ruptura e selecione o combatente rival. Favores, Suprimentos e Cerco são economias da partida, diferentes das moedas da conta.','campaign','breach','.lane-hunt'],
 ['O confronto','Encerre a rodada. Aliados prontos atacam, sangramentos resolvem e sobreviventes disputam as frentes. Empates não premiam. Conquistas dão XP e recursos.','pass',null,'.end-turn'],
 ['Frenesi e clímax','Neste exercício você recebeu 6 Frenesi. Use a suprema e escolha um alvo rival. Durante partidas, atacar e abater geram Frenesi.','ultimate',null,'.ultimate-button']
];
let game=null,index=0,done=false;
function fighter(id,uid){const c=CARDS[id];return {uid,cardId:id,attack:c.attack,health:c.health,maxHealth:c.health,influence:c.influence,tempAttack:0,tempInfluence:0,ready:true,level:1,kills:0,bleed:0,equipment:0,gearItems:[],guard:c.keyword==='guard'};}
export function academyStart(faction,step=0){index=Math.min(LESSONS.length-1,Math.max(0,step));done=false;game=createGame(faction,()=>.5);const p=game.players[0],enemy=game.players[1];p.energy=7;p.favors=3;p.supplies=4;p.siege=3;p.rage=6;enemy.passed=true;
 const own=Object.values(CARDS).find(c=>c.faction===faction&&c.type==='unit'&&c.cost<=2),foe=Object.values(CARDS).find(c=>c.faction===enemy.faction&&c.type==='unit'&&c.cost<=2),gear=Object.values(CARDS).find(c=>c.type==='equipment'&&['neutral',faction].includes(c.faction)&&c.cost<=3);
 p.hand=[{uid:'lesson-card',cardId:index===1?gear.id:own.id}];if(index!==0)p.lanes.court.push(fighter(own.id,'lesson-ally'));if([2,3,6,8].includes(index))enemy.lanes.court.push(fighter(foe.id,'lesson-rival'));return academyView();}
export function academyView(){return {...publicView(game,0),roomId:'academy',tutorial:true,opponent:{name:'Sentinela de treino',avatar:'thorn'},battlefield:'court-board',rewards:{},waiting:false};}
export function academyAct(action){const lesson=LESSONS[index];if(done)throw Error('Exercício concluído. Continue para a próxima lição.');if(action.type!==lesson[2]||(lesson[2]==='campaign'&&action.tactic!==lesson[3])||(lesson[2]==='play'&&CARDS[game.players[0].hand.find(c=>c.uid===action.uid)?.cardId]?.type!==lesson[3]))throw Error('Iria: '+lesson[1]);game=applyAction(game,0,action,{visuals:true});done=true;return academyView();}
export function academyPanel(){const l=LESSONS[index];return `<aside class="academy-coach" role="region" aria-label="Orientação de Iria"><img src="/assets/avatars/oracle.png" alt="Iria"><div><small>IRIA · TREINO ${index+1}/${LESSONS.length} · SEM PERDAS</small><h3>${l[0]}</h3><p>${done?'Muito bem. Observe o resultado na mesa antes de continuar.':l[1]}</p><button data-academy-next ${done?'':'disabled'}>${index===LESSONS.length-1?'CONCLUIR TREINO':'PRÓXIMO EXERCÍCIO'}</button><button data-academy-exit>SAIR DO TREINO</button></div></aside>`;}
export function academyStep(){return index;}
export function academyHighlight(){if(!done)document.querySelector(LESSONS[index][4])?.classList.add('academy-focus');}
