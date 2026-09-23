export const ORDERS={
 tribute:{category:'court',name:'Edito de Tributo',cost:2,resource:'favors',text:'A próxima carta rival nesta rodada custa +1. Não acumula.'},
 bribe:{category:'court',name:'Pacto de Fronteira',cost:1,resource:'favors',text:'+2 poder de conquista na frente escolhida, até o confronto.'},
 immunity:{category:'court',name:'Salva-Guarda',cost:2,resource:'favors',text:'Um aliado bloqueia 1 dano uma vez nesta rodada. Não renova uma Guarda já usada.'},
 logistics:{category:'crypt',name:'Manobra Logística',cost:1,resource:'supplies',text:'Mova um aliado entre frentes. Mantém feridas, equipamentos e estado de ataque.'},
 field_repair:{category:'crypt',name:'Socorro de Campo',cost:2,resource:'supplies',text:'Cure 3 de vida de um aliado ferido. Não repara durabilidade de equipamentos.'},
 rations:{category:'crypt',name:'Requisição',cost:2,resource:'supplies',text:'Compre 1 carta. Exige espaço na mão e carta no baralho.'},
 breach:{category:'hunt',name:'Ruptura',cost:1,resource:'siege',text:'Cause 2 de dano a um combatente inimigo.'},
 plunder:{category:'hunt',name:'Incursão',cost:2,resource:'siege',text:'Cause 2 de dano ao líder rival e receba 1 recurso, até o limite de 7.'}
};
export const BATTLE_LEVELS=[0,3,7,12];
export const AVATAR_IDS=['vesper','kael','mordrath','raven','thorn','oracle'];
export const ORIGINS={
 exile:{name:'Exilado da Corte',text:'Você conhece o preço de um segredo e carrega um selo sem soberano.',oath:'Nenhum trono acima de um juramento.'},
 keeper:{name:'Guardião das Ruínas',text:'Entre as pedras de Véspera, você procura os nomes que a guerra apagou.',oath:'Nenhum nome será esquecido.'},
 wanderer:{name:'Peregrino do Eclipse',text:'Sua casa é a estrada. Sua lealdade pertence a quem atravessa a noite ao seu lado.',oath:'A noite não levará os meus.'}
};
