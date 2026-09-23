# Refinamento da aventura

## Ciclo de jogo

Criar identidade → preparar deck e equipamentos → explorar → disputar frentes → receber recompensas → reparar, criar e reequipar → avançar na crônica.

Os menus **Seu juramento → Personagem** e **Decks → Equipamentos** permitem alterar a identidade e preparar uma expedição. No combate, tocar no título de uma frente ou no nível do líder abre o Conselho de Guerra com as regras.

## Escopo dos oito tópicos

1. **Integração:** conquistas de frentes alimentam recompensas e objetivos de expedição. A reposição de equipamentos usa reservas e respeita as regras de construção.
2. **Acabamento de produto:** regras compartilhadas entre interface e servidor; validação de trocas; explicações de custos, limites e progressão. Não representa certificação de lançamento: estabilidade, acessibilidade, dispositivos e balanceamento ainda precisam de validação prática.
3. **Efeitos:** famílias de sangue, lua, túmulo, corte, aço, fogo e garras, com variações determinísticas por carta, invocação e impacto. Não são animações manualmente exclusivas para cada uma das cartas. Sons sintetizados acompanham as famílias.
4. **RPG:** quatro capítulos adicionais, totalizando doze, com objetivos de exploração, construção, dungeons e conquistas, escolhas narrativas e recompensas. As novas escolhas registram narrativa; não criam rotas mecânicas independentes.
5. **Personagem:** nome, seis retratos e três origens narrativas salvos no perfil. Origem e aparência são cosméticas; não restringem o acesso às duas linhagens.
6. **Cenas:** composição animada de cenários e retratos existentes na criação, nas entradas de expedição e nas conclusões de capítulos. São cenas em tempo real, com continuação manual e suporte a movimento reduzido, não arquivos de vídeo.
7. **Equipamentos:** peças indisponíveis recebem substitutos; peças restauradas só retornam se o deck continuar válido. O menu rápido troca uma posição por equipamento disponível, preservando limites, propriedade e curva. Alterações são bloqueadas durante partidas e removem o jogador da fila de matchmaking.
8. **Microaventura:** três economias temporárias, ordens limitadas por frente, níveis do líder e das criaturas, além da ligação com o progresso persistente.

## Regras da microaventura

- Corte disputa influência; Catacumbas e Caçada disputam ataque. Poder adicional modifica conquista, não dano.
- Cada frente permite uma ordem por jogador por rodada. Uma ordem consome a ação normal.
- Favores têm limite 5; Suprimentos, 6; Cerco, 3. Permanecem entre rodadas e zeram ao terminar a partida.
- Tributo custa 2 Favores e afeta somente a próxima carta da rodada. Não acumula.
- Salva-Guarda é temporária e não renova uma Guarda já usada.
- Requisição exige carta no baralho e espaço na mão. Socorro cura a criatura, não a durabilidade persistente.
- O líder ganha 1 XP por morte rival e 2 por conquista. Níveis em 0/3/7/12 XP; recompensas: +2 vida máxima e atual, depois +2 Suprimentos, depois +1 Favor e +1 Cerco, respeitando limites. A evolução não ressuscita um líder derrotado.
- Criaturas sobreviventes ganham 2 XP por abate direto e 1 por conquista. Evoluem em 2/6 XP; cada evolução concede +1 ataque e +2 vida.
- Os níveis de batalha reiniciam a cada partida. O nível de exploração continua separado.
- Objetivos de frentes na crônica contam uma vez por frente em cada vitória de expedição elegível, mantendo o intervalo de recompensas existente.

## Validação e limites

Foram conferidas a sintaxe dos arquivos JavaScript modificados, as referências aos cenários/retratos utilizados e a integridade textual do diff. Não foram executados testes, partidas simuladas ou verificações em navegadores/dispositivos, conforme a preferência anterior do usuário. Os novos custos e curvas de XP são uma proposta inicial limitada por rodada e por nível; ainda precisam de playtests e telemetria para afirmar equilíbrio competitivo.


## Segunda etapa: aprendizado e continuidade

- Prólogo mobile: retrato em área própria, proporção preservada, texto abaixo e rolagem dentro da janela. No modo paisagem baixo, o retrato é omitido para priorizar diálogo e botões.
- Jornada de Iria: acesso pelo botão ✧ no menu. Nove exercícios interativos usando a engine real em uma mesa local isolada. Cada exercício prepara recursos e alvos próprios; não é uma partida competitiva completa. Não concede recompensas nem usa equipamentos persistentes. O treino reinicia ao recarregar a página.
- Orientações contextuais em decks, equipamentos, Relicário, boosters, contratos e Conselho de Guerra. O restante dos sistemas permanece consultável; ainda não existe um tutorial interativo dedicado a cada ação de política e comércio.
- Campanha agora com quinze capítulos; doze patamares de conquistas únicas e três linhas recorrentes de juramentos. Conquistas são verificadas no servidor e usam estatísticas existentes. Juramentos pagam 40 marcas e 8 sucatas a cada cinco vitórias elegíveis com a frente correspondente. Não aumentam atributos de PvP e não expiram.
- Cliques: reconstrução de janelas adiada enquanto o ponteiro está pressionado. Fechar/navegar não fica bloqueado por uma operação alheia; operações econômicas continuam protegidas contra duplicação.
- SFX: impactos procedurais em camadas, variação, transientes, ressonâncias metálicas e caudas; filtragem também nos osciladores e descarte de nós ao terminar. Limite de 64 vozes. São sons sintetizados, não gravações de foley ou biblioteca de estúdio.

Referência de design: [Guild Wars 2 — World XP and You](https://www.guildwars2.com/en/news/world-xp-and-you/), para progressão compartilhada e horizontal. A adaptação mantém conquistas e recompensas fora dos atributos competitivos. Custos e emissões precisam de acompanhamento: adicionar objetivos não demonstra, por si só, equilíbrio global. Não foram executados playtests, audição comparativa ou testes de dispositivos nesta etapa.
