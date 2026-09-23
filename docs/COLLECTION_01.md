# Edição I · Crônicas de Véspera

Primeira coleção jogável de Bloodmoon. A Edição I tem 100 cartas de facção (50 da Corte Rubra e 50 da Alcateia do Eclipse), 60 equipamentos neutros persistentes e uma sentinela neutra de dungeon: 161 cartas no catálogo. As listas iniciais continuam com 20 cartas cada; a expansão abre caminhos para pressão, Guarda, Transbordo, Frenesi, equipamento, política, Drenar, Sangramento e controle.

## Símbolos e estados

**Drenar** cura o líder pela quantidade de dano realmente causada por um ataque, contra criatura ou líder. **Sangramento** marca a criatura que sobreviveu ao ataque; no confronto da rodada ela recebe o dano acumulado e as marcas são removidas. **Guarda** reduz em 1 o primeiro impacto recebido na rodada. **Transbordo** leva ao líder o dano que sobra ao abater uma criatura. **Sinergia** dispara por evento descrito no texto, entre cartas aliadas na mesma frente, no máximo uma vez por rodada. Equipamentos adicionam atributos e uma palavra-chave persistente à criatura ou ao líder; cada deck leva no máximo seis, cada criatura recebe duas peças e o líder uma. As peças têm três usos, desgaste, reparo e risco de quebra ou saque conforme o modo.

As 118 cartas adicionadas e seus textos completos são definidas em [`shared/edition-one-expansion.js`](../shared/edition-one-expansion.js): 25 unidades e 9 rituais vampíricos, 24 unidades e 8 rituais lupinos, além de 52 equipamentos. Essa fonte é o catálogo autoritativo usado pelo motor, Arsenal, construção de deck, mercado e boosters. A arte atual atribui os novos IDs a regiões compatíveis do atlas de 16 cenas; arte única por carta depende da próxima geração de assets.

## Corte Rubra

| Carta | Raridade | Custo | Tipo e atributos | Texto de regra |
| --- | --- | ---: | --- | --- |
| Emissária do Véu | Comum | 2 | Aliada 1/4 · Influência 3 | Presença política forte na Corte. |
| Duelista Carmesim | Incomum | 3 | Aliado 4/3 · Influência 1 | Atacante de alto dano e baixa resistência. |
| Guardião do Limiar | Comum | 1 | Aliado 1/3 · Influência 1 | Defensor de custo leve. |
| Oráculo da Cinza | Rara | 4 | Aliada 3/5 · Influência 4 | Grande presença política e resistência. |
| Dízimo de Sangue | Comum | 1 | Ritual | Perca 2 de vida e compre 2 cartas. |
| Pacto dos Ausentes | Incomum | 2 | Ritual | +4 poder de conquista em uma frente nesta rodada. |
| Ceifadora Escarlate | Rara | 3 | Aliada 3/4 · Drenar | Cura pelo dano causado ao atacar. |
| Execução Rubra | Rara | 3 | Ritual | Cause 4 de dano a um inimigo escolhido. |
| Morcego do Banquete | Comum | 1 | Aliado 1/2 · Drenar | Cura pelo dano causado ao atacar. |
| Duquesa das Cinzas | Rara | 4 | Aliada 3/5 · Influência 4 | Conquista política da Corte. |
| Sanguinista da Corte | Comum | 2 | Aliado 1/3 · Influência 3 | Sinergia: um ritual nesta frente concede +1 influência até o fim da rodada. |
| Escrivã do Dízimo | Incomum | 2 | Aliado 2/3 | Sinergia: a primeira morte aliada nesta frente compra 1 carta. |
| Viúva do Crepúsculo | Comum | 2 | Aliada 2/3 | Sinergia: a primeira morte aliada nesta frente cura 1 do líder. |
| Marechal Escarlate | Rara | 3 | Aliado 3/4 · Influência 2 | Sinergia: um ritual nesta frente concede +1 ataque até o fim da rodada. |
| Voto da Câmara Rubra | Comum | 1 | Ritual | +3 poder de conquista em uma frente nesta rodada. |
| Cavaleiro do Cálice Negro | Rara | 4 | Aliado 4/4 · Drenar | Cura pelo dano causado ao atacar. |

## Alcateia do Eclipse

| Carta | Raridade | Custo | Tipo e atributos | Texto de regra |
| --- | --- | ---: | --- | --- |
| Batedora da Geada | Comum | 1 | Aliada 2/2 · Influência 1 | Pressiona desde o primeiro turno. |
| Presa do Eclipse | Incomum | 3 | Aliado 4/4 · Influência 1 | Combatente de linha de frente. |
| Anciã das Raízes | Comum | 2 | Aliada 2/4 · Influência 2 | Equilíbrio entre combate e política. |
| Colosso da Lua Partida | Rara | 5 | Aliado 6/6 · Influência 2 | A ameaça de maior custo do deck inicial. |
| Uivo de Ruptura | Comum | 2 | Ritual | Cause 2 de dano a um inimigo escolhido. |
| Memória Selvagem | Comum | 1 | Ritual | Recupere 3 de vida do líder. |
| Rasga-Carne | Incomum | 3 | Aliado 3/5 · Sangramento | Ao ferir um inimigo que sobrevive, deixa Sangramento. |
| Salto Predatório | Incomum | 2 | Ritual | Dê +2 ataque e um novo ataque a um aliado. |
| Presalva Tumular | Rara | 4 | Aliada 5/3 · Sangramento | Agressão que pune bloqueadores frágeis. |
| Chamadora da Lua Oca | Comum | 2 | Aliada 2/3 · Influência 2 | Conecta a Matilha à disputa política. |
| Chama da Alcateia | Incomum | 2 | Ritual | Cause 2 de dano a um inimigo escolhido. |
| Corredor da Geada | Comum | 2 | Aliado 2/3 | Sinergia: invocar outro lobisomem nesta frente dá +1 ataque até o fim da rodada. |
| Uivadora das Feridas | Incomum | 3 | Aliada 3/3 | Sinergia: aplicar Sangramento nesta frente dá +1 ataque até o fim da rodada. |
| Mordedora Estelar | Comum | 1 | Aliada 2/1 · Sangramento | Ataque leve que abre uma ferida persistente. |
| Guardião do Musgo Antigo | Comum | 2 | Aliado 1/4 · Influência 2 | Coringa de defesa e Corte. |
| Rastro de Sangue | Rara | 2 | Ritual | Cause 1 dano e aplique Sangramento a um inimigo. |
| Alfa da Lua Partida | Rara | 4 | Aliado 4/5 · Influência 2 | Sinergia: invocar outro lobisomem nesta frente dá +1 ataque até o fim da rodada. |
| Oráculo do Uivo Branco | Épica | 5 | Aliado 4/5 · Influência 2 | Sinergia: um ritual nesta frente dá +1 ataque até o fim da rodada. |

## Relíquias neutras

| Carta | Raridade | Custo | Texto de regra |
| --- | --- | ---: | --- |
| Lâmina de Obsidiana | Comum | 1 | Uma criatura recebe +2 ataque. Peça persistente, 3 usos. |
| Manto de Ossos | Comum | 1 | Uma criatura recebe +3 vida máxima e atual. Peça persistente, 3 usos. |
| Fragmento da Primeira Noite | Rara | 1 | Item de loot; uma criatura recebe +1 ataque e +2 vida. Peça persistente, 3 usos. |
| Sentinela Sepulcral | Lendária | 2 | Aliado neutro 2/6; guardião do Rei Sepultado. |
| Estilhaço Escarlate | Comum | 1 | Uma criatura recebe +1 ataque e +1 vida. Peça persistente, 3 usos. |
| Coração da Primeira Noite | Épica | 3 | Uma criatura recebe +2 ataque e +2 vida. Peça persistente, 3 usos. |
| Malha de Marfim | Comum | 1 | Uma criatura recebe +2 vida; em um líder amplia vida máxima e atual. Peça persistente, 3 usos. |
| Presa do Eclipse | Incomum | 2 | Uma criatura recebe +2 ataque e +1 vida; em um líder fortalece habilidades e vida máxima. Peça persistente, 3 usos. |
| Diadema do Rei Oco | Rara | 2 | Uma criatura recebe +1 ataque e +3 vida; em um líder fortalece habilidades e vida máxima. Peça persistente, 3 usos. |

## Sinergias para experimentar

**Câmara de Sangue:** alinhe Sanguinista e Marechal com rituais como Voto, Pacto ou Dízimo. O primeiro ritual da rodada fortalece a disputa da frente e o combate seguinte. Escrivã e Viúva convertem uma morte aliada em compra ou cura, favorecendo trocas calculadas.

**Matilha Ferida:** Corredor e Alfa crescem quando outro lobisomem entra na mesma frente; Uivadora aproveita Sangramento aplicado por Rasga-Carne, Presalva, Mordedora ou Rastro. Salto Predatório reutiliza o atacante que recebeu o bônus.

**Relíquias e curva:** cada equipamento combina bônus de atributo e um efeito entre Sangramento, Drenar, Guarda, perfuração, Frenesi, cura, foco político ou reforço. O deck inicial dá Lâmina e Manto vinculados ao juramento; não podem ser negociados nem saqueados, mas podem se desgastar ou quebrar. Peças abertas em booster, criadas ou encontradas em dungeon são comerciáveis. Cartas neutras cabem nos dois decks, mas contam para o limite de cópias e seis espaços de equipamento. No booster, quatro cartas são de coleção e a quinta é sempre uma nova peça de equipamento.

## Listas iniciais

**Corte Rubra · Juramento Inicial:** 2 Emissárias, 2 Duelistas, 2 Guardiões, 2 Morcegos, 2 Sanguinistas, 1 Escrivã, 1 Ceifadora, 1 Oráculo, 1 Dízimo, 1 Pacto, 1 Execução, 2 Viúvas, 1 Lâmina e 1 Manto.

**Alcateia do Eclipse · Primeiro Uivo:** 2 Batedoras, 2 Anciãs, 2 Presas, 2 Corredores, 2 Uivadoras, 1 Presalva, 1 Rasga-Carne, 1 Colosso, 2 Uivos, 1 Memória, 1 Salto, 1 Chama, 1 Lâmina e 1 Manto.

As duas listas têm 20 cartas, 8 ou mais aliados, curva baixa e nenhum par de cartas lendárias. Os cards que o jogador possui continuam disponíveis em todas as listas; editar um deck não consome cópias adicionais.
