// Player-facing vocabulary follows the implemented engine, including gear variants.
export const CODEX={
 lifesteal:['Drenar','♦','Combate','Ao atacar, cura seu líder pelo dano efetivamente causado, inclusive contra criaturas.'],
 bleed:['Sangrar','≋','Combate','Ao atacar uma criatura que sobrevive, aplica 1 Sangramento. Acumula, causa dano no confronto e então é removido.'],
 guard:['Guarda','⬡','Combate','Bloqueia 1 de dano uma vez por rodada. Uma Guarda temporária dura somente a rodada indicada.'],
 overwhelm:['Transbordo','➶','Combate','Ao derrotar uma criatura com um ataque maior que sua vida restante, o excesso atinge o líder rival.'],
 fury:['Frenesi','✹','Combate','Esta propriedade concede Frenesi adicional ao atacar. O medidor para em 6; a suprema consome os 6 pontos.'],
 pierce:['Perfurar','↗','Equipamentos','Na criatura equipada, acrescenta 1 ao dano de ataque. No líder, soma 1 ao bônus de dano de habilidades. Não ignora Guarda.'],
 focus:['Foco','◈','Equipamentos','Na criatura equipada, concede +1 influência. No líder, soma 1 ao bônus de dano de habilidades.'],
 mend:['Restaurar','✚','Equipamentos','Na criatura equipada, cura 1 após atacar. No líder, cura 1 ao equipar e ao usar uma habilidade. Não recupera durabilidade.'],
 rally:['Reforço','⚑','Combate','Fortalece aliados. O valor, o alvo e a duração dependem da carta; consulte o efeito impresso.'],
 synergy:['Sinergia','✧','Combate','Reage ao evento indicado na carta, na mesma frente, até uma vez por rodada. Atributos temporários expiram após o confronto.'],
 sacrifice:['Sacrifício','†','Combate','Troca vitalidade por compra de cartas. Consulte os valores impressos; perder vida também pode derrotar seu líder.'],
 conquest:['Poder de conquista','♜','Frentes','Corte soma influência; Catacumbas e Caçada somam ataque. +Poder ajuda a conquistar a frente e não aumenta dano. Empates não premiam.'],
 influence:['Influência','♜','Frentes','Atributo usado na disputa da Corte. Não causa dano de ataque.'],
 damage:['Dano','⚔','Combate','Reduz a vida do alvo. Guarda pode bloquear 1; ao chegar a zero, o alvo é derrotado. Valores e alvos vêm da carta.'],
 heal:['Cura','♥','Combate','Recupera vida até o máximo do alvo. Não ressuscita um líder derrotado.'],
 execute:['Execução','☠','Combate','Causa o dano indicado na carta. O nome não significa eliminação automática de qualquer criatura.'],
 pounce:['Salto','➟','Combate','Aumenta o ataque do aliado pelo valor da carta e o prepara para atacar novamente. Esse aumento permanece enquanto a criatura estiver na mesa.'],
 rend:['Dilacerar','╳','Combate','Causa dano a uma criatura escolhida. Se ela sobreviver, aplica 1 Sangramento. Não atinge toda a frente.'],
 drain:['Drenagem','♦','Combate','Causa dano a uma criatura e cura seu líder pelo dano causado. Se a criatura sobreviver, aplica 1 Sangramento.'],
 rage:['Ímpeto','✹','Combate','Concede o Frenesi indicado na carta, até o limite de 6. A suprema consome o medidor completo.'],
 draw:['Comprar','▤','Combate','Leva cartas do baralho para a mão, que comporta até 10. Compras com baralho vazio causam fadiga crescente.'],
 equipment:['Equipamento','⚒','Equipamentos','Carta associada a uma peça do inventário: até 6 no deck, 2 em cada criatura e 1 no líder. O alvo recebe atributos e efeitos.'],
 durability:['Durabilidade','⚒','Equipamentos','Peças utilizadas sofrem desgaste ao concluir a batalha. Ao esgotar, saem do deck e recebem reservas; as recuperáveis ficam no Relicário para reparo.'],
 reserve:['Reserva','↻','Equipamentos','Substituto automático para equipamento indisponível. Mantém o deck jogável; use Equipamento Rápido para escolher outra peça.'],
 bound:['Vinculado','⛓','Equipamentos','Peça ligada ao seu juramento. Não pode ser anunciada no mercado nem saqueada como item negociável.'],
 energy:['Sangue / Fúria','◆','Recursos','Recurso para jogar cartas e usar habilidades. Começa em 3, renova a cada rodada e cresce até 7. Não é dinheiro da conta.'],
 favors:['Favores','♜','Recursos','Obtidos conquistando a Corte. Financiam política; limite 5. Até uma ordem da Corte por rodada.'],
 supplies:['Suprimentos','◇','Recursos','Obtidos conquistando Catacumbas. Financiam manobra, socorro e compra; limite 6. Até uma ordem das Catacumbas por rodada.'],
 siege:['Cerco','⚔','Recursos','Obtido conquistando a Caçada. Financia Ruptura e Incursão; limite 3. Até uma ordem da Caçada por rodada.'],
 renown:['Renome','♛','Frentes','Conquistas concedem Renome. No confronto, 12 pode encerrar a partida; após a rodada 8, Renome e depois vida decidem o vencedor.'],
 coins:['Marcas','◈','Progressão','Moeda persistente usada em boosters, reparos, fabricação e comércio. Consulte o custo antes de confirmar uma ação.'],
 dust:['Fragmentos','✦','Progressão','Material persistente para criar cartas. Duplicatas acima do limite podem ser convertidas em fragmentos.'],
 scrap:['Sucata','⚒','Progressão','Material persistente para fabricar equipamentos, obtido em recompensas e recuperação de peças.'],
 provisions:['Provisões','◉','Progressão','Mantimentos de Reinos: viagem e coleta custam 1; iniciar uma mesa de expedição custa 2. Reabasteça no domínio.'],
 experience:['Experiência','★','Progressão','A conta, a exploração em Reinos e o nível de batalha são progressões diferentes. Níveis do líder e criaturas na mesa reiniciam a cada partida.'],
 stories:['Crônica e histórias','▧','Progressão','A Crônica avança por capítulos. Histórias secundárias registram novas ações após aceitação e oferecem escolhas e recompensas únicas.'],
 doctrine:['Preparação','⚑','Progressão','Regra de abertura da expedição que afeta os dois lados. É mantida nas mesas da dungeon e não muda o PvP.'],
 ready:['Pronto / exausto','✓','Combate','Um aliado pronto pode atacar uma vez por rodada. Após atacar fica exausto; Salto pode prepará-lo novamente.'],
 combo:['Combo','◆','Combate','A terceira carta jogada na rodada causa 2 de dano ao líder rival e concede 2 Frenesi. A contagem reinicia por rodada.']
};
export function cardTerms(c){return [...new Set([c.type==='equipment'?'equipment':null,c.keyword,c.gearEffect,c.effect==='influence'?'conquest':c.effect,c.synergy?'synergy':null].filter(k=>CODEX[k]))];}
export function termDescription(key,c){
 if(key==='fury'&&c?.type==='equipment')return 'Na criatura, concede Frenesi adicional ao atacar. No líder, concede 1 ao equipar e ao usar habilidade. Limite do medidor: 6.';
 if(key==='rally'&&c?.type==='equipment')return 'Na criatura, dá +1 ataque temporário ao equipar, além dos atributos da peça. No líder, dá +1 poder à frente escolhida nesta rodada.';
 return CODEX[key]?.[3]||'';
}
export const QUICK_RULES={lifesteal:'Dano causado cura seu líder',bleed:'Sobrevivente sangra no confronto',guard:'Bloqueia 1 dano por rodada',overwhelm:'Dano excedente atinge o líder',fury:'+Frenesi ao atacar',pierce:'+1 dano ao atacar',focus:'+1 influência no aliado',mend:'Cura 1 após atacar',rally:'Fortalece aliados',synergy:'Reage na mesma frente · 1×/rodada',sacrifice:'Pague vida para comprar',conquest:'+Poder para conquistar a frente',influence:'Disputa o domínio da Corte',damage:'Reduz a vida do alvo',heal:'Recupera vida do líder',execute:'Dano alto em uma criatura',pounce:'Mais ataque e prepara o aliado',rend:'Dano + Sangramento se sobreviver',drain:'Dano cura líder e marca sobrevivente',draw:'Compra cartas para a mão',rage:'+Frenesi para a suprema',equipment:'Equipe: ganha atributos e efeito'};
