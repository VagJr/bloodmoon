import {RuleError} from './engine.js';

export const SIDE_STORIES=[
 {id:'ferry',name:'O último barco',portrait:'oracle',level:1,node:'quarry',stat:'gathers',goal:3,label:'Coletas após aceitar',text:'Iria encontrou famílias presas na margem. Reúna madeira e abra uma rota até a pedreira antes que a névoa cubra o rio.',choices:[['shelter','Construir abrigo','As famílias acendem a primeira lanterna do porto.'],['ferry','Restaurar a travessia','O barqueiro promete passagem a quem não pode pagar.']],coins:35,scrap:6},
 {id:'letters',name:'Cartas sem selo',portrait:'vesper',level:2,node:'rosekeep',stat:'court',goal:2,label:'Vitórias elegíveis com a Corte',text:'Uma mensageira desapareceu levando os nomes dos conspiradores. Vença pela influência e leve as cartas à fortaleza das rosas.',choices:[['publish','Entregar ao conselho','Os nomes tornam-se públicos. A mensageira recebe proteção.'],['bargain','Negociar a libertação','Os prisioneiros regressam; os nomes ficam sob sua guarda.']],coins:45,scrap:8},
 {id:'anvil',name:'O ferro dos esquecidos',portrait:'thorn',level:2,node:'quarry',stat:'crypt',goal:2,label:'Vitórias elegíveis com Catacumbas',text:'Thorn reconheceu marcas de antigos guardiões nos estoques saqueados. Recupere as reservas e decida o destino desse ferro.',choices:[['bells','Forjar sinos de aviso','As aldeias passam a ouvir o perigo antes de vê-lo.'],['shields','Forjar escudos','Os novos sentinelas carregam os nomes dos antigos.']],coins:45,scrap:12},
 {id:'tracks',name:'Pegadas no degelo',portrait:'kael',level:3,node:'moonwood',stat:'hunt',goal:3,label:'Vitórias elegíveis com a Caçada',text:'Uma matilha deixou marcas de fuga, não de caça. Kael pede que você abra caminho pela fronteira e encontre os sobreviventes.',choices:[['escort','Escoltar os sobreviventes','A matilha encontra abrigo sem entregar sua liberdade.'],['watch','Guardar a passagem','Você mantém a rota aberta para os que ainda virão.']],coins:55,scrap:10},
 {id:'choir',name:'O coro sem voz',portrait:'raven',level:4,node:'abbey',stat:'dungeons',goal:2,label:'Dungeons concluídas após aceitar',text:'Corvo ouviu nomes humanos no canto da Abadia. Desça aos sepulcros, reúna testemunhos e encontre uma forma de silenciar a fome.',choices:[['names','Devolver os nomes','Os sinos passam a lembrar pessoas, não vitórias.'],['silence','Romper o vínculo','Pela primeira vez, a Abadia dorme em silêncio.']],coins:70,scrap:15},
 {id:'table',name:'A mesa dos adversários',portrait:'vesper',level:5,node:'crown',stat:'wins',goal:5,label:'Vitórias em expedições após aceitar',text:'Vesper e Kael aceitam sentar à mesma mesa se as rotas estiverem seguras. Demonstre que sua bandeira protege quem vive fora de seus muros.',choices:[['accord','Firmar uma trégua','A primeira refeição termina sem juramentos de vingança.'],['council','Criar um conselho itinerante','A mesa passa a viajar até aqueles que antes não tinham voz.']],coins:85,scrap:18}
];
export function storyValue(r,key){return ['court','crypt','hunt'].includes(key)?r.adventure.stats.fronts?.[key]||0:r.adventure.stats[key]||0;}
export function storyProgress(r,s){const entry=r.adventure.stories?.[s.id];return {entry,value:entry?Math.max(0,storyValue(r,s.stat)-entry.baseline):0,visited:r.visited.includes(s.node),ready:!!entry&&!entry.choice&&storyValue(r,s.stat)-entry.baseline>=s.goal&&r.visited.includes(s.node)};}
export function storyAction(r,input){
 const s=SIDE_STORIES.find(x=>x.id===input.id);if(!s)throw new RuleError('História desconhecida.');
 const progress=storyProgress(r,s);
 if(input.type==='story-accept'){
  if(r.level<s.level)throw new RuleError('Alcance o nível de exploração indicado.');
  if(progress.entry)throw new RuleError('Você já aceitou esta história.');
  if(Object.values(r.adventure.stories||{}).filter(x=>!x.choice).length>=3)throw new RuleError('Conclua uma das três histórias em andamento.');
  r.adventure.stories||={};r.adventure.stories[s.id]={baseline:storyValue(r,s.stat)};return null;
 }
 if(!progress.ready)throw new RuleError('Conclua os objetivos antes de escolher o desfecho.');
 const choice=s.choices.find(c=>c[0]===input.choice);if(!choice)throw new RuleError('Escolha um desfecho válido.');
 progress.entry.choice=choice[0];return {coins:s.coins,scrap:s.scrap,text:s.name+': '+choice[2]};
}
