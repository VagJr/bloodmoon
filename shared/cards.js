import { EXPANSION_EQUIPMENT, EXPANSION_VAMPIRE, EXPANSION_WEREWOLF } from './edition-one-expansion.js';

export const FACTIONS = {
  vampire: { name: 'Corte Rubra', leader: 'Vesper, a Regente sem Trono', resource: 'Sangue', description: 'Pactos, sacrifícios e domínio da Corte.' },
  werewolf: { name: 'Alcateia do Eclipse', leader: 'Kael, o Último Juramento', resource: 'Fúria', description: 'Pressão, resistência e supremacia na Caçada.' }
};

export const LANES = [
  { id: 'court', name: 'Corte', icon: '♜', reward: '2 Renome + cura 1', description: 'Converta presença em influência política.' },
  { id: 'crypt', name: 'Catacumbas', icon: '◇', reward: '1 Renome + relíquia', description: 'Conquiste equipamento para esta aventura.' },
  { id: 'hunt', name: 'Caçada', icon: '☾', reward: '1 Renome + 3 dano', description: 'Ataque diretamente a vitalidade do rival.' }
];

export const CARDS = {
  envoy: { id: 'envoy', name: 'Emissária do Véu', faction: 'vampire', type: 'unit', cost: 2, attack: 1, health: 4, influence: 3, text: 'Presença política: 3 de influência na Corte.', flavor: 'Toda promessa projeta uma sombra.' },
  duelist: { id: 'duelist', name: 'Duelista Carmesim', faction: 'vampire', type: 'unit', cost: 3, attack: 4, health: 3, influence: 1, text: 'Uma lâmina veloz. Um pacto frágil.', flavor: 'A última palavra é sempre de aço.' },
  thrall: { id: 'thrall', name: 'Guardião do Limiar', faction: 'vampire', type: 'unit', cost: 1, attack: 1, health: 3, influence: 1, text: 'Defensor de baixo custo.', flavor: 'Ainda se lembra do sol.' },
  oracle: { id: 'oracle', name: 'Oráculo da Cinza', faction: 'vampire', type: 'unit', cost: 4, attack: 3, health: 5, influence: 4, text: 'Alta influência e resistência.', flavor: 'O futuro tem gosto de ferro.' },
  blood: { id: 'blood', name: 'Dízimo de Sangue', faction: 'vampire', type: 'spell', cost: 1, effect: 'sacrifice', text: 'Perca 2 de vitalidade. Compre 2 cartas.', flavor: 'Toda vantagem cobra um nome.' },
  pact: { id: 'pact', name: 'Pacto dos Ausentes', faction: 'vampire', type: 'spell', cost: 2, effect: 'influence', effectAmount:4, text: '+4 poder de conquista em uma frente nesta rodada.', flavor: 'Os mortos também votam.' },
  scout: { id: 'scout', name: 'Batedora da Geada', faction: 'werewolf', type: 'unit', cost: 1, attack: 2, health: 2, influence: 1, text: 'Pressão desde o primeiro turno.', flavor: 'Nenhum rastro fica para trás.' },
  fang: { id: 'fang', name: 'Presa do Eclipse', faction: 'werewolf', type: 'unit', cost: 3, attack: 4, health: 4, influence: 1, text: 'Combatente de linha de frente.', flavor: 'A lua não pede licença.' },
  elder: { id: 'elder', name: 'Anciã das Raízes', faction: 'werewolf', type: 'unit', cost: 2, attack: 2, health: 4, influence: 2, text: 'Equilíbrio entre combate e política.', flavor: 'A floresta guarda seus juramentos.' },
  alpha: { id: 'alpha', name: 'Colosso da Lua Partida', faction: 'werewolf', type: 'unit', cost: 5, attack: 6, health: 6, influence: 2, text: 'Um compromisso pesado de recursos.', flavor: 'Até as muralhas aprendem a temer.' },
  howl: { id: 'howl', name: 'Uivo de Ruptura', faction: 'werewolf', type: 'spell', cost: 2, effect: 'damage', text: 'Cause 2 de dano a um inimigo escolhido na frente.', flavor: 'O silêncio se parte primeiro.' },
  renewal: { id: 'renewal', name: 'Memória Selvagem', faction: 'werewolf', type: 'spell', cost: 1, effect: 'heal', text: 'Recupere 3 de vitalidade.', flavor: 'A cicatriz é um caminho de volta.' },
  blade: { id: 'blade', name: 'Lâmina de Obsidiana', faction: 'neutral', type: 'equipment', cost: 1, attack: 2, health: 0, text: 'Equipe um aliado: +2 ataque. Em seu líder, habilidades recebem +1 dano. Máximo: 2 por criatura, 1 no líder.', flavor: 'Forjada onde a luz termina.' },
  ward: { id: 'ward', name: 'Manto de Ossos', faction: 'neutral', type: 'equipment', cost: 1, attack: 0, health: 3, text: 'Equipe um aliado: +3 vida máxima e atual. Em seu líder, +3 vida máxima e atual. Máximo: 2 por criatura, 1 no líder.', flavor: 'Uma dívida que veste bem.' },
  relic: { id: 'relic', name: 'Fragmento da Primeira Noite', faction: 'neutral', type: 'equipment', cost: 1, attack: 1, health: 2, text: 'Catacumbas podem criar uma cópia temporária desta carta. Equipe uma criatura: +1 ataque e +2 vida.', flavor: 'Antes do primeiro amanhecer, houve uma escolha.' }
};

Object.assign(CARDS, {
  reaver: { id:'reaver', name:'Ceifadora Escarlate', faction:'vampire', type:'unit', cost:3, attack:3, health:4, influence:1, keyword:'lifesteal', text:'Drenar: ao atacar, cura seu líder pelo dano causado.', flavor:'A noite bebe através dela.' },
  ravager: { id:'ravager', name:'Rasga-Carne', faction:'werewolf', type:'unit', cost:3, attack:3, health:5, influence:1, keyword:'bleed', text:'Sangrar: ataques contra aliados aplicam 1 dano no fim da rodada.', flavor:'O primeiro golpe nunca é o último.' },
  execution: { id:'execution', name:'Execução Rubra', faction:'vampire', type:'spell', cost:3, effect:'execute', text:'Cause 4 de dano a um inimigo escolhido.', flavor:'Nem toda sentença precisa de palavras.' },
  pounce: { id:'pounce', name:'Salto Predatório', faction:'werewolf', type:'spell', cost:2, effect:'pounce', text:'Um aliado ganha +2 ataque e pode atacar novamente.', flavor:'Não existe lugar seguro.' },
  warden: { id:'warden', name:'Sentinela Sepulcral', faction:'neutral', type:'unit', cost:2, attack:2, health:6, influence:1, text:'Guardião do Rei Sepultado.', flavor:'Nem a morte encerrou seu serviço.' },
  bloodbat: { id:'bloodbat', name:'Morcego do Banquete', faction:'vampire', type:'unit', cost:1, attack:1, health:2, influence:1, keyword:'lifesteal', text:'Drenar: cure seu líder pelo dano causado em ataques, inclusive contra combatentes.', flavor:'A fome também sabe voar.' },
  duchess: { id:'duchess', name:'Duquesa das Cinzas', faction:'vampire', type:'unit', cost:4, attack:3, health:5, influence:4, text:'Uma voz pode derrubar um castelo.', flavor:'Sua corte começa onde ela respira.' },
  gravefang: { id:'gravefang', name:'Presalva Tumular', faction:'werewolf', type:'unit', cost:4, attack:5, health:3, influence:1, keyword:'bleed', text:'Sangrar: deixa feridas abertas no inimigo.', flavor:'O túmulo não era para ela.' },
  mooncaller: { id:'mooncaller', name:'Chamadora da Lua Oca', faction:'werewolf', type:'unit', cost:2, attack:2, health:3, influence:2, text:'Conduz o juramento e a investida.', flavor:'A lua partida ainda ouve seu nome.' },
  bloodshard: { id:'bloodshard', name:'Estilhaço Escarlate', faction:'neutral', type:'equipment', cost:1, attack:1, health:1, text:'Equipe um aliado: +1 ataque e +1 vida. Em seu líder, habilidades recebem +1 dano e +1 vida.', flavor:'O cristal pulsa ao ouvir seu portador.'},
  moonfire: { id:'moonfire', name:'Chama da Alcateia', faction:'werewolf', type:'spell', cost:2, effect:'damage', text:'Cause 2 de dano a um inimigo escolhido.', flavor:'A lua também sabe queimar.'},
  nightcourt: { id:'nightcourt', name:'Sanguinista da Corte', faction:'vampire', type:'unit', cost:2, attack:1, health:3, influence:3, tags:['court','coven'], synergy:{trigger:'spell-played', stat:'influence', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, ao lançar ritual nesta frente, recebe +1 influência até o fim da rodada.', flavor:'Cada voto tem um preço rubro.'},
  bloodscribe: { id:'bloodscribe', name:'Escrivã do Dízimo', faction:'vampire', type:'unit', cost:2, attack:2, health:3, influence:1, rarity:'uncommon', tags:['coven','sacrifice'], synergy:{trigger:'ally-dies', effect:'draw', amount:1, limit:'round'}, text:'Sinergia · na primeira morte aliada nesta frente a cada rodada, compre 1 carta.', flavor:'Nenhuma dívida desaparece com o devedor.'},
  duskwidow: { id:'duskwidow', name:'Viúva do Crepúsculo', faction:'vampire', type:'unit', cost:2, attack:2, health:3, influence:1, tags:['coven','blood'], synergy:{trigger:'ally-dies', effect:'heal', amount:1, limit:'round'}, text:'Sinergia · na primeira morte aliada nesta frente a cada rodada, cure 1 do líder.', flavor:'Ela chora apenas quando alguém está olhando.'},
  scarletmarshal: { id:'scarletmarshal', name:'Marechal Escarlate', faction:'vampire', type:'unit', cost:3, attack:3, health:4, influence:2, rarity:'rare', tags:['court','coven'], synergy:{trigger:'spell-played', stat:'attack', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, ao lançar ritual nesta frente, recebe +1 ataque até o fim da rodada.', flavor:'A ordem da Corte chega antes da lâmina.'},
  redvow: { id:'redvow', name:'Voto da Câmara Rubra', faction:'vampire', type:'spell', cost:1, effect:'influence', rarity:'common', tags:['ritual','court','coven'], text:'Conceda +3 poder de conquista à frente escolhida nesta rodada.', flavor:'A Corte nunca vota de graça.'},
  bloodguard: { id:'bloodguard', name:'Cavaleiro do Cálice Negro', faction:'vampire', type:'unit', cost:4, attack:4, health:4, influence:1, rarity:'rare', keyword:'lifesteal', tags:['blood','coven','lifesteal'], text:'Drenar · cure seu líder pelo dano causado em ataques, mesmo contra combatentes.', flavor:'Seu escudo guarda a sede de uma dinastia.'},
  crimsonrelic: { id:'crimsonrelic', name:'Coração da Primeira Noite', faction:'neutral', type:'equipment', cost:3, attack:2, health:2, rarity:'epic', tags:['relic','blood'], text:'Equipe uma criatura: +2 ataque e +2 vida. Em seu líder, habilidades recebem +1 dano e +2 vida máxima.', flavor:'A relíquia pulsa quando a guerra recomeça.'},
  packrunner: { id:'packrunner', name:'Corredor da Geada', faction:'werewolf', type:'unit', cost:2, attack:2, health:3, influence:1, tags:['pack','hunt'], synergy:{trigger:'ally-summoned', faction:'werewolf', stat:'attack', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, ao invocar outro lobisomem nesta frente, recebe +1 ataque até o fim da rodada.', flavor:'A alcateia chega antes que a neve se assente.'},
  moonhowler: { id:'moonhowler', name:'Uivadora das Feridas', faction:'werewolf', type:'unit', cost:3, attack:3, health:3, influence:1, rarity:'uncommon', tags:['pack','bleed','moon'], synergy:{trigger:'bleed-applied', stat:'attack', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, quando inimigo começa a sangrar nesta frente, recebe +1 ataque até o fim da rodada.', flavor:'O uivo encontra cada ferida aberta.'},
  starmaw: { id:'starmaw', name:'Mordedora Estelar', faction:'werewolf', type:'unit', cost:1, attack:2, health:1, influence:1, keyword:'bleed', tags:['pack','bleed','hunt'], text:'Sangrar · ao ferir um inimigo que sobrevive, causa 1 dano adicional no confronto.', flavor:'Uma estrela cadente. Uma presa certeira.'},
  mosskeeper: { id:'mosskeeper', name:'Guardião do Musgo Antigo', faction:'werewolf', type:'unit', cost:2, attack:1, health:4, influence:2, tags:['pack','moon','court'], text:'Resiste na Corte e protege uma frente por vez.', flavor:'Raízes também sabem cerrar os dentes.'},
  bloodtrail: { id:'bloodtrail', name:'Rastro de Sangue', faction:'werewolf', type:'spell', cost:2, effect:'rend', rarity:'rare', tags:['ritual','bleed','hunt'], text:'Cause 1 dano a um inimigo escolhido e aplique Sangramento.', flavor:'A caça só termina quando a trilha esfria.'},
  frostalpha: { id:'frostalpha', name:'Alfa da Lua Partida', faction:'werewolf', type:'unit', cost:4, attack:4, health:5, influence:2, rarity:'rare', tags:['pack','moon'], synergy:{trigger:'ally-summoned', faction:'werewolf', stat:'attack', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, ao invocar outro lobisomem nesta frente, recebe +1 ataque até o fim da rodada.', flavor:'A alcateia inteira cabe em um único rugido.'},
  howlcaller: { id:'howlcaller', name:'Oráculo do Uivo Branco', faction:'werewolf', type:'unit', cost:5, attack:4, health:5, influence:2, rarity:'epic', tags:['pack','moon','ritual'], synergy:{trigger:'spell-played', stat:'attack', amount:1, limit:'round'}, text:'Sinergia · uma vez por rodada, ao lançar ritual nesta frente, recebe +1 ataque até o fim da rodada.', flavor:'A lua responde em vozes que já partiram.'}
});
export const CARD_SET = { id:'edition-one', name:'Crônicas de Véspera', symbol:'I', cards:Object.keys(CARDS).length };
Object.assign(CARDS, {
  ivorychain: { id:'ivorychain', name:'Malha de Marfim', faction:'neutral', type:'equipment', cost:1, attack:0, health:2, rarity:'common', tags:['relic','guard'], text:'Um aliado recebe +2 vida. Em um líder, aumenta a vida máxima e atual em 2.', flavor:'Cada elo guarda uma última oração.' },
  fangofeclipse: { id:'fangofeclipse', name:'Presa do Eclipse', faction:'neutral', type:'equipment', cost:2, attack:2, health:1, rarity:'uncommon', tags:['relic','hunt'], text:'Um aliado recebe +2 ataque e +1 vida. Em um líder, fortalece habilidades e vida máxima.', flavor:'A lua morde de volta.' },
  blackcrown: { id:'blackcrown', name:'Diadema do Rei Oco', faction:'neutral', type:'equipment', cost:2, attack:1, health:3, rarity:'rare', tags:['relic','court'], text:'Um aliado recebe +1 ataque e +3 vida. Em um líder, fortalece habilidades e amplia a vida máxima.', flavor:'Todo trono cobra uma parte de quem o usa.' }
});
Object.assign(CARDS,Object.fromEntries([...EXPANSION_VAMPIRE,...EXPANSION_WEREWOLF,...EXPANSION_EQUIPMENT].map(card=>[card.id,card])));
CARD_SET.cards=Object.keys(CARDS).length;
export const ART = { vampire:0, werewolf:1, envoy:2, duelist:3, thrall:4, oracle:5, scout:6, fang:7, elder:8, alpha:9, blade:10, ward:11, blood:12, pact:13, relic:14, boss:15, howl:1, renewal:8, reaver:0, ravager:7, execution:12, pounce:9, warden:15, bloodbat:6, duchess:0, gravefang:7, mooncaller:8, bloodshard:14, moonfire:1, nightcourt:2, bloodscribe:5, duskwidow:13, scarletmarshal:3, redvow:12, bloodguard:4, crimsonrelic:14, packrunner:6, moonhowler:8, starmaw:7, mosskeeper:9, bloodtrail:13, frostalpha:10, howlcaller:5, ivorychain:11, fangofeclipse:7, blackcrown:15 };
const artPools={vampire:[0,2,3,4,5,12,13],werewolf:[1,6,7,8,9,10],neutral:[11,14,15]};
for(const card of Object.values(CARDS))if(ART[card.id]===undefined){let hash=0;for(const char of card.id)hash=(hash*31+char.charCodeAt(0))>>>0;const pool=artPools[card.faction]||artPools.neutral;ART[card.id]=pool[hash%pool.length];}
const common = ['envoy','thrall','blood','scout','elder','howl','renewal','blade','ward','bloodbat','mooncaller','bloodshard','nightcourt','duskwidow','redvow','packrunner','starmaw','mosskeeper','ivorychain'];
const uncommon = ['duelist','pact','fang','ravager','pounce','moonfire','bloodscribe','moonhowler','fangofeclipse'];
const rare = ['oracle','relic','reaver','execution','duchess','gravefang','alpha','scarletmarshal','bloodguard','bloodtrail','frostalpha','blackcrown'];
const epic = ['warden','crimsonrelic','howlcaller'];
for (const id of common) CARDS[id].rarity ||= 'common';
for (const id of uncommon) CARDS[id].rarity ||= 'uncommon';
for (const id of rare) CARDS[id].rarity ||= 'rare';
for (const id of epic) CARDS[id].rarity ||= 'epic';
CARDS.warden.rarity = 'legendary';
for (const c of Object.values(CARDS)) c.tags ||= [c.faction === 'vampire' ? 'coven' : c.faction === 'werewolf' ? 'pack' : 'relic'];
const tagsById = {
  envoy:['court','coven'],duelist:['blood','blade'],thrall:['guard','coven'],oracle:['court','ritual'],blood:['ritual','sacrifice'],pact:['ritual','court'],
  scout:['pack','hunt'],fang:['pack','hunt'],elder:['pack','court'],alpha:['pack','moon'],howl:['ritual','bleed'],renewal:['ritual','moon'],
  blade:['relic','blade'],ward:['relic','guard'],relic:['relic','blood'],reaver:['blood','lifesteal'],ravager:['pack','bleed'],execution:['ritual','removal'],
  pounce:['ritual','pack'],warden:['relic','guard'],bloodbat:['blood','lifesteal'],duchess:['court','coven'],gravefang:['pack','bleed'],mooncaller:['pack','court'],
  bloodshard:['relic','blood'],moonfire:['ritual','moon','removal']
};
for (const [id,tags] of Object.entries(tagsById)) CARDS[id].tags=tags;
export const HEROES = {
  vampire: { name:'Vesper', title:'A Regente Carmesim', skill:'Beijo da Morte', description:'2 recursos · causa 2 de dano a qualquer inimigo e cura você em 2.', ultimate:'Eclipse de Sangue' },
  werewolf: { name:'Kael', title:'O Devorador da Lua', skill:'Dilacerar', description:'2 recursos · causa 3 de dano a qualquer inimigo.', ultimate:'Fúria Ancestral' }
};

export const DECKS = {
  vampire: ['envoy','envoy','duelist','duelist','thrall','thrall','bloodbat','bloodbat','nightcourt','nightcourt','bloodscribe','reaver','oracle','blood','pact','execution','duskwidow','duskwidow','blade','ward'],
  werewolf: ['scout','scout','elder','elder','fang','fang','packrunner','packrunner','moonhowler','moonhowler','gravefang','ravager','alpha','howl','howl','renewal','pounce','moonfire','blade','ward']
};

export const EVENTS = [
  { name: 'O portão sem dono', text: 'As três frentes se abrem. Escolha o preço da sua ambição.', lane: null },
  { name: 'Banquete de máscaras', text: 'A Corte concede +1 Renome nesta rodada.', lane: 'court' },
  { name: 'A cripta desperta', text: 'As Catacumbas concedem +1 Renome nesta rodada.', lane: 'crypt' },
  { name: 'Sangue nas ruas', text: 'A Caçada concede +1 Renome nesta rodada.', lane: 'hunt' },
  { name: 'Conselho dos exilados', text: 'A Corte concede +1 Renome nesta rodada.', lane: 'court' },
  { name: 'Coração enterrado', text: 'As Catacumbas concedem +1 Renome nesta rodada.', lane: 'crypt' },
  { name: 'O último juramento', text: 'A Caçada concede +1 Renome nesta rodada.', lane: 'hunt' },
  { name: 'Antes do amanhecer', text: 'Última rodada. Renome decidirá quem escreverá a história.', lane: null }
];
