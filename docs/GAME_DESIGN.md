# Bloodmoon · Sangue & Fúria — regras 0.4

## Identidade

TCG digital de fantasia sombria medieval em Véspera. A Corte Rubra e a Alcateia do Eclipse disputam fortalezas, catacumbas e territórios de caça; o Rei Sepultado protege a coroa que liga as três frentes. Uma partida é uma aventura curta: convocar combatentes, escolher alvos, formar uma sinergia, ganhar Renome e sair com XP, moeda e cartas.

As cartas são originais e usam referências amplas de jogos de cartas e RPG. A primeira coleção autoral, **Crônicas de Véspera · Edição I**, possui 100 cartas de facção divididas igualmente, 60 equipamentos e uma sentinela neutra. A experiência de tabuleiro continua sendo a prioridade; catálogo, deck builder e economia são menus do refúgio.

## Estados do jogo

O servidor é a autoridade para regras e propriedade de cartas. Uma sala tem os estados `waiting`, `playing` e `finished`; durante `playing`, `turn` identifica o líder que age, `passed` registra quem encerrou e `version` impede uma ação baseada em uma tela antiga. Cada jogador tem vida, recursos, Frenesi, mão, baralho, três fileiras, bônus temporários, habilidades usadas e unidades prontas/exaustas. A interface acrescenta os estados locais de carta selecionada, aliado selecionado, alvo, arrasto, validação de frente e resolução visual.

Carta inválida por custo, facção, alvo, cópia, tamanho ou limite de frente não altera o estado. No tabuleiro, soltar em área incompatível mantém a carta selecionada para outra tentativa. Durante uma resolução, o controle fica bloqueado até a atualização voltar; isso evita enviar duas ações com a mesma versão.

## Preparação e turno

- Líder comum começa com 24 de vida; Mordrath tem 36. Baralho tem 20 cartas, mão inicial de 5 e compra 1 por nova rodada. A preparação garante dois aliados jogáveis de custo até 2 na abertura.
- O primeiro líder inicia com 3 recursos. O máximo aumenta em 1 por rodada até 7; ao começar a rodada, o recurso é renovado. A mão tem limite 10; compra sem cartas aplica Fadiga crescente ao líder.
- Jogadores alternam ações. Jogar uma carta consome seu custo. Atacar com aliado pronto é gratuito e cada aliado ataca uma vez por rodada. Habilidade comum custa 2, uma vez por rodada. A Suprema custa 6 Frenesi, uma vez por rodada.
- Passar encerra as ações daquele jogador. O outro ainda pode agir; quando ambos passam, resolve-se o confronto e as três disputas de frente. Depois recursos, prontidão, bônus temporários e limites por rodada são reiniciados, cada lado compra uma carta e começa a rodada seguinte.
- Se o adversário já passou, o jogador ativo pode continuar agindo; uma nova passagem conclui a rodada. Não existe vantagem por velocidade de clique.

## Ataques, dano e efeitos

Um aliado ataca uma criatura inimiga da mesma frente. Se essa frente estiver vazia, pode atacar o líder. Dano e revide são resolvidos no mesmo ataque; o defensor revida mesmo se o golpe inicial o derrubar. Mortos são removidos depois da troca, Frenesi/abates são contabilizados e efeitos de morte podem disparar.

No confronto automático de fim da rodada, criaturas são pareadas pela ordem em que entraram na frente. Só uma criatura ainda pronta causa dano; quem já atacou fica esgotado e não golpeia uma segunda vez. Após as trocas, Sangramento causa seu valor acumulado e é removido. Combatentes que morrem não contam para conquistar a frente.

**Drenar** cura o líder pelo dano efetivamente causado pelo ataque, mesmo quando o alvo é criatura. **Sangramento** só é aplicado quando o alvo sobrevive; as marcas acumulam até o confronto. **Guarda** bloqueia 1 dano do primeiro impacto na rodada, **Transbordo** carrega excesso de dano de abate ao líder, e **Frenesi** acelera as supremas. Equipamentos aplicam efeitos próprios de combate e podem disparar sinergias de equipamento. **Salto Predatório** dá +2 ataque permanente e permite atacar novamente. Bônus de Suprema e de Sinergia duram até terminar a rodada.

Rituais de dano e execução exigem uma criatura rival. Salto exige aliado; equipamento pode mirar um aliado ou o líder. Rituais sem alvo podem ser jogados em qualquer frente. Vesper causa 2 de dano a inimigo e cura 2; Kael causa 3. A Suprema causa 5 a um alvo e dá +1 ataque até o fim da rodada aos aliados da frente escolhida; Vesper também cura 3.

## As três frentes

| Frente | Poder comparado | Vitória no confronto |
| --- | --- | --- |
| Corte | Influência dos aliados + bônus | 2 Renome e cura 1 |
| Catacumbas | Ataque dos aliados + bônus | 1 Renome e coloca Fragmento da Primeira Noite na mão |
| Caçada | Ataque dos aliados + bônus | 1 Renome e causa 3 de dano ao líder rival |

Maior poder conquista a frente; empate não recompensa ninguém. O evento fixo da rodada pode somar +1 Renome à frente indicada. O Pacto dos Ausentes dá +4 poder em uma frente; Voto da Câmara Rubra dá +3. Esses bônus desaparecem na próxima rodada.

## Frenesi, evolução e vitória

Ataque direto dá +1 Frenesi; abater um combatente dá +2; perder um aliado dá +1; habilidade comum dá +1. O limite é 6. Combo de três cartas na rodada causa 2 de dano ao líder rival e dá +2 Frenesi.

Um atacante que abate e sobrevive evolui depois do primeiro e do terceiro abate em ataque direto: cada nível dá +1 ataque e +2 vida atual/máxima. Ritual e confronto automático não evoluem combatentes nesta edição.

Vitória imediata ocorre quando um líder chega a 0. Cair juntos dá empate. Ao resolver a rodada, alcançar 12 Renome encerra a partida; na rodada 8, maior Renome vence e vida desempata. Igualdade nos dois valores dá empate.

## Sinergias

Sinergias usam gatilhos reais do motor, não só texto de ambientação. Cada unidade só pode acionar sua habilidade uma vez por rodada, e o gatilho precisa ocorrer na mesma frente:

- **Rituais:** Sanguinista da Corte recebe +1 Influência; Marechal Escarlate e Oráculo do Uivo Branco recebem +1 ataque.
- **Nova invocação:** Corredor da Geada e Alfa da Lua Partida recebem +1 ataque quando outro lobisomem entra.
- **Sangramento:** Uivadora das Feridas recebe +1 ataque quando um inimigo começa a sangrar.
- **Morte aliada:** Escrivã do Dízimo compra uma carta; Viúva do Crepúsculo cura 1 do líder.

Os bônus temporários combinam com Dízimo, Uivo, Rastro de Sangue, Salto e disputas por frente. A coleção tem cartas que reagem a rituais, invocações por facção, ataques, Sangramento, morte inimiga/aliada e equipamento; as travas por frente e por rodada mantêm a cadeia de ativações legível. Tags como `court`, `pack`, `sacrifice`, `bleed`, `ritual`, `relic`, `hunt` e `moon` alimentam a régua de composição e futuras cartas. A combinação é aberta; as regras de facção, cópia, unidades e curva impedem listas ilegais.

## Decks e régua de equilíbrio

Cada deck tem exatamente 20 cartas, pelo menos 8 aliados, incluindo ao menos 2 aliados de custo 2 ou menos para garantir jogadas nas mãos iniciais, média máxima de 4,5 recursos, até 2 cópias de uma carta e 1 lendária. Pode usar a própria facção e cartas neutras, com no máximo 6 cartas de equipamento. Equipamentos contam como cópias do card para limites; cada vaga selecionada também exige uma instância utilizável, não anunciada e com durabilidade. As cartas comuns continuam compartilhadas entre listas; ao iniciar uma partida, cada peça de equipamento é reservada exclusivamente para aquela sala.

O editor exibe curva, unidades/rituais/equipamentos, contagem de cartas com sinergia, arquétipo sugerido e um índice médio. O orçamento de unidade pesa ataque, vida, influência, palavra-chave e sinergia contra uma expectativa baseada no custo; efeitos têm pesos por tipo e custo. A referência 100 é a linha-base: abaixo de 78 sinaliza carta/deck provavelmente leve, acima de 112 pede revisão de eficiência. É uma régua de criação e leitura, não um modificador secreto durante a partida.

O conjunto usa quatro arquétipos iniciais: **Corte de Sangue** (política e drenagem), **Matilha Ferida** (pressão e sangramento), **Ritual & Controle** (remoções e disputa planejada) e **Sacrifício Carmesim** (compra e risco de vida). Uma lista pode misturar planos. Composição legal, limite de cópia e curva de custo moderam extremos; o índice ajuda a localizar cartas fora da faixa. Ajuste final de poder deve acompanhar partidas humanas das duas facções.

## Onboarding e progressão

No primeiro acesso, o jogador escolhe uma facção e recebe o deck pré-construído correspondente, 300 Marcas, as cartas do deck e suas peças iniciais vinculadas ao juramento. O deck funciona em treino, dungeon e duelo; no Arsenal, cartas próprias podem ser inspecionadas e criadas. O editor monta outra lista usando as mesmas cópias da coleção; só cartas possuídas entram nela. O deck equipado é usado ao criar sala; em duelo, o rival troca o deck de abertura pelo próprio ao entrar.

XP: 100 por vitória e 50 por derrota/empate; 300 XP elevam um nível. A cada nível, 60 Marcas e 10 Fragmentos. Recompensas de partida variam por modo: duelo 45/25, treino 20/10 e dungeon 50/20 Marcas para vitória/derrota. Desistência não paga. Contratos recorrentes: 3 partidas (+60 Marcas), 5 abates (+50 Marcas, 10 Fragmentos) e 2 vitórias (+80 Marcas, 15 Fragmentos); avançam ao terminar partidas.

## Economia e boosters

**Marcas** compram boosters; **Fragmentos** criam cartas. Um booster custa 100 Marcas e entrega 5 resultados: 2 cartas comuns, 1 incomum, 1 premium com 78% rara/19% épica/3% lendária e 1 equipamento garantido. O equipamento tem pesos próprios (60% comum, 25% incomum, 12% raro, 3% épico); cada abertura coloca uma instância nova com durabilidade no Relicário. Os pesos ficam visíveis antes de abrir. Quando a coleção já atingiu o limite de cópias da carta revelada, o prêmio vira Fragmentos: 8/16/40/100/250 por raridade. Criar custa 40/90/220/500/1000 Fragmentos por carta.

### Relicário, desgaste e mercado

Equipamentos são cartas de deck, mas cada cópia é também um item de conta com identificador próprio, raridade, origem, vínculo e 3 pontos de durabilidade. Só equipamentos consomem limite de cópias por instância. O deck pode incluir até 6; cada criatura aceita até 2 e cada líder aceita 1. Um item equipado no líder dá metade do ataque impresso (arredondado para cima) às habilidades e aumenta a vida atual/máxima pelo valor de vida da carta. Custos impressos afetam o uso durante a partida; atributos não persistem na criatura após a batalha.

Em uma caçada concluída, item de criatura abatida perde 2 de durabilidade; item que permaneceu equipado ao fim da batalha perde 1. Isso também vale no treino e na dungeon, para que o equipamento sempre tenha custo de manutenção. Ao zerar, a peça sai do inventário e rende Sucata por raridade: 4/7/12/20/35. Cada ponto faltante pode ser reparado por 12/20/36/60/100 Marcas, conforme raridade. Sucata também participa da criação de equipamentos. O vencedor da dungeon recebe uma peça aleatória: 42% comum, 34% incomum, 19% rara e 5% épica.

Duelo usa por padrão o **Pacto**: desgaste ocorre, mas nada muda de dono. Antes de criar um duelo, o anfitrião pode escolher **Juramento de Sangue**; ao entrar, o rival também precisa aceitar. Neste risco compartilhado, um abatedor pode tomar uma peça não vinculada de uma criatura abatida, já com 1 ponto de desgaste. O vencedor também pode tomar a peça equipada no líder derrotado, com o mesmo desgaste. Itens vinculados do deck inicial nunca são transferidos; ainda podem se desgastar e quebrar. Não há saque em empate.

Peças não vinculadas podem ser anunciadas por 5 a 5.000 Marcas; anúncio custa 3% do preço e não é reembolsado. A venda retém 7% de imposto, o vendedor recebe o restante e anúncios expiram em 72 horas. Preço, raridade e durabilidade aparecem no mercado. Peças anunciadas ou reservadas para uma partida não podem ser equipadas, reparadas ou anunciadas novamente. Comprar transfere a instância e sua durabilidade; comprar a própria oferta é bloqueado. Criar uma peça custa 25/50/100/200/350 Marcas mais 18/32/60/110/180 Sucata por raridade, de comum a lendária. A economia local usa Marcas, Fragmentos e Sucata sem dinheiro real.

Marcas vêm de partidas, contratos e níveis; Fragmentos vêm de contratos, níveis e duplicatas; Sucata vem de partidas e quebra de equipamentos. Equipamentos não são consumidos por abrir um booster duplicado: cada revelação gera uma nova peça comerciável. A carta provisória entregue ao conquistar Catacumbas é um efeito de combate da partida, não uma peça permanente do inventário; vitórias na dungeon são a fonte atual de drops permanentes garantidos. A economia é local/protótipo; uma versão comercial precisaria transações, razão auditável, controles de abuso e análise de inflação.

## Dungeon e apresentação

O encontro atual é Mordrath: 36 de vida, Sentinela Sepulcral 2/6 inicial, maldição de 1 dano no jogador por rodada e reforço ao chegar à metade da vida. A Coroa do Rei Sepultado é um troféu sem atributo. A campanha ainda é um encontro, sem mapa de rotas persistentes.

Cartas e combatentes voam até o alvo; dano atualiza vida do líder ou criatura, com partículas, pulso, impacto e número legível. Invocação, Sangramento, Drenar, sinergias, saque, combo e mortes possuem eventos de combate. Molduras e selos nomeiam os alvos válidos durante clique e arrasto. O resultado mostra XP, Marcas, Fragmentos, Sucata, saques e peças quebradas. O estado autoritativo vem antes da animação; redução de movimento mantém os valores finais sem obrigar uma sequência longa.

## Limites atuais

Perfis e inventário ficam em arquivo JSON local; salas em memória; duelo por código; o mercado é local ao mesmo servidor/processo e não faz transações entre instâncias. Não há matchmaking, ranking, campanha longa nem validação de economia em produção. O índice não substitui playtests, e parte da coleção reutiliza o atlas artístico do protótipo; a ilustração própria do pacote físico da Edição I ainda precisa ser produzida.
