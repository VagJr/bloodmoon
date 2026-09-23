# Bloodmoon · Sangue & Fúria

TCG de combate e RPG em fantasia sombria medieval. A versão 0.4 combina arena 2.5D, confrontos por frente, sinergias, coleção, editor de decks e um relicário com equipamentos persistentes, risco compartilhado e mercado local — sem compras com dinheiro real.

## Jogar

Requer Node.js 22+. Sem instalação de dependências.

```sh
npm start
```

Abra http://127.0.0.1:4173. No primeiro acesso, escolha vampiros ou lobisomens para receber um deck pré-construído de 20 cartas e 300 Marcas. Inicie uma caçada contra a IA, desafie o Rei Sepultado ou crie uma sala 1×1. Ganhe moedas/Fragmentos, abra boosters, crie cartas e equipe decks diferentes pelo refúgio.

## Controles

- Clique em uma carta e depois na frente para invocar; arraste até a frente ou diretamente sobre um aliado/inimigo válido. O brilho verde marca criaturas-alvo, o dourado marca uma frente compatível e o vermelho indica posição incompatível. Ao soltar fora ou cancelar o arrasto, a carta continua selecionada; `Escape` limpa a seleção.
- Clique em um aliado pronto e depois no inimigo da mesma frente para atacar. Sem bloqueador, o líder rival é um alvo válido.
- Equipamentos e rituais ofensivos permitem escolher o alvo individual; selos verdes e dourados mostram o que aceita o clique ou o arrasto, e o vermelho marca um alvo inválido.
- Habilidade do líder: 2 recursos, uma vez por rodada. Suprema: 6 Frenesi, uma vez por rodada.
- Encerrar conclui suas ações; quando ambos encerram, o confronto e os saques são resolvidos.
- No Arsenal, filtre as 161 cartas da Edição I e clique ou passe o mouse para abrir a face completa e a inspeção de regras. Em Decks, monte listas de 20 usando as cópias que possui; o botão “Equipar” usa aquela lista na próxima sala.
- Boosters custam 100 Marcas e revelam quatro cartas de coleção e um equipamento persistente com animação. Contratos e caçadas dão moedas; Fragmentos criam cartas quando a coleção não tem cópias suficientes.
- No relicário, equipamentos têm 3 usos, podem ser reparados, criados, anunciados e comprados. Cada deck leva até 6; criaturas usam até 2 e líderes usam 1.
- Duelo pode ser criado com Pacto (desgaste sem transferência) ou Juramento de Sangue, com consentimento do rival e possibilidade de perder/saquear uma peça não vinculada.
- Escape cancela seleção ou abre/fecha o menu. O botão `?` abre o guia.

## Implementado

- Arte original de arena e atlas de 16 ilustrações, iluminação, névoa, cartas e retratos.
- Trajetórias de cartas e combatentes, números de dano/cura, sangue e cura em partículas, tremor e brilho no alvo, barras de vida animadas, banners de combo, evolução e frenesi; suporte a movimento reduzido.
- Coleção Crônicas de Véspera · Edição I: 50 cartas vampíricas, 50 lupinas, 60 equipamentos e uma sentinela neutra, com raridades e dois decks iniciais de 20.
- Sinergias funcionais de ritual, invocação, ataques, sangramento, equipamentos e mortes aliadas; bônus limitados a uma vez por rodada e à mesma frente.
- Cartas e equipamentos de inventário persistentes, boosters de cinco faces completas, conversão de duplicatas em Fragmentos, criação/reparo de itens, mercado local e edição/inspeção de decks.
- Onboarding com escolha de facção, deck grátis e 300 Marcas; contratos recorrentes, XP/níveis, recompensas por modo e sem compra com dinheiro real.
- Validação de deck no servidor: 20 cartas, pelo menos 8 aliados (incluindo 2 de custo até 2 para uma abertura jogável), média de até 4,5 recursos, duas cópias por carta e uma lendária.
- Ataque direto com revide, exaustão, sangramento e drenagem.
- Habilidades de Vesper/Kael, combo na terceira carta da rodada e supremas.
- Combatentes evoluem ao sobreviver a abates; até dois equipamentos por aliado.
- Dungeon de um encontro: Mordrath, 36 de vida, sentinela inicial, maldição por rodada e fortalecimento ao entrar em uma rodada com metade da vida.
- XP, nível de conta e troféu da dungeon persistentes; troféu sem vantagem competitiva.
- Salas 1×1 por código, visão privada, estado validado pelo servidor e retomada da última sala na mesma sessão do navegador.

Arte do pacote de booster: a interface de abertura usa a arte do Rei Sepultado do atlas atual enquanto a embalagem exclusiva e ilustrações únicas para as cartas adicionadas à expansão aguardam um gerador de imagens conectado. O atlas existente é um fallback de protótipo, não arte inédita por carta.

## Comandos e estrutura

`npm test`: testes de API e regras, incluindo boosters, sinergias de equipamento, 200 partidas comuns e 12 dungeons simuladas. `npm run check`: validação de sintaxe. `npm run dev`: reinicia o servidor ao editar (salas em memória serão perdidas).

```text
client/app.js         Refúgio, onboarding, coleção, decks, economia e arena
client/effects.js     Feedback visual e áudio sintetizado opcional
client/styles.css     Aparência do jogo e adaptação de telas
client/layout.css     Ajustes finos de enquadramento
client/assets/       Arena e atlas de arte original
shared/cards.js      Edição I, arte, heróis e eventos
shared/engine.js     Motor autoritativo e eventos de combate
shared/progression.js Régua de decks, onboarding e economia
server/index.js      API, salas, inventário, decks e recompensas
tests/               Regras originais, novas mecânicas e API
docs/                Design, arquitetura, próximos passos e arte
```

Para testar duas pessoas, use navegadores/perfis diferentes (uma janela anônima funciona). O criador escolhe facção; o convidado recebe a oposta e usa o deck equipado daquela facção, caso tenha um. Na mesma aba, o menu permite voltar ao refúgio e retomar a sala. Salas não sobrevivem ao reinício do servidor.

Para rede privada, defina `HOST=0.0.0.0` no ambiente e use o IP da máquina. `.env.example` é referência, não carregado automaticamente. `DATA_DIR` permite um diretório alternativo para os perfis, útil nos testes.

## Limites

Protótipo local, não serviço comercial. Perfis usam uma credencial local sem login real. Dados em JSON, salas em memória e atualização por consulta a cada 1,5 segundo. Ainda não há matchmaking, ranking, trocas, sincronização entre dispositivos, campanha com várias salas ou recuperação após falha do servidor. O índice de deck é uma régua de autoria, não um MMR ou ajuste oculto. Arte por atlas pode ser refinada por carta; áudio sintetizado, sem trilha gravada. Animações representam eventos confirmados pelo motor, sem replay quadro a quadro. Combate alterna ações; não é tempo real.

Balanceamento e diversão exigem sessões humanas; simulações verificam consistência. Melhor experiência em desktop ou tablet horizontal. Em telas verticais pequenas, elementos são compactados e a arena pode exigir rolagem vertical em alturas abaixo de 730 px.

[Design e regras](docs/GAME_DESIGN.md) · [Edição I](docs/COLLECTION_01.md) · [Plano de evolução](docs/ROADMAP.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Artes, prompts e referências](docs/ART_DIRECTION.md)
