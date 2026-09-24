import {RuleError} from './engine.js';
export const DOCTRINES={
 standard:{name:'Juramento da Vigília',icon:'◈',level:1,board:'forest-board',text:'Regras tradicionais. Planeje suas conquistas e abasteça sua próxima viagem.'},
 council:{name:'Conselho das Máscaras',icon:'♜',level:2,board:'court-board',text:'Ambos os líderes começam com 2 Favores. Política desde a primeira rodada.'},
 caravan:{name:'Caravana dos Exilados',icon:'⚒',level:3,board:'siege-board',text:'Ambos começam com 2 Suprimentos. Movimentação, socorro ou compra desde a abertura.'},
 siege:{name:'Cerco do Eclipse',icon:'⚔',level:4,board:'crypt-board',text:'Ambos começam com 1 Cerco e +4 de vida máxima. Ruptura disponível na primeira rodada.'}
};
export function chooseDoctrine(r,id){
 if(!Object.hasOwn(DOCTRINES,id))throw new RuleError('Preparação desconhecida.');
 if(r.activeRoom||r.expedition)throw new RuleError('Conclua ou recue da expedição antes de mudar sua preparação.');
 if(r.level<DOCTRINES[id].level)throw new RuleError('Alcance o nível de exploração indicado.');
 r.doctrine=id;
}
export function applyDoctrine(game,id='standard'){
 if(!Object.hasOwn(DOCTRINES,id))throw new RuleError('Preparação desconhecida.');
 for(const p of game.players){if(id==='council')p.favors=2;if(id==='caravan')p.supplies=2;if(id==='siege'){p.siege=1;p.health+=4;p.maxHealth+=4;}}
 game.log.push('Preparação: '+DOCTRINES[id].name+'. '+DOCTRINES[id].text);
}
