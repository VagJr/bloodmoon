# Arquitetura e contratos — versão 0.4

Atualização: além da arena 2.5D, o refúgio, Arsenal, Decks, boosters e relicário usam janelas com linguagem de jogo e quadros ilustrados. Reinos acrescenta atlas ilustrado, presença de jogadores, viagem, coleta, domínio, Casas, políticas, guerra territorial e expedições de uma a três mesas. Os estados do combate continuam no motor comum. Equipamentos mantêm identidade individual, desgaste, reparo, reserva e liquidação de risco. Regras e coleção estão em `GAME_DESIGN.md` e `COLLECTION_01.md`.

## Fundação entregue

Aplicação JavaScript em módulos ES, Node.js 22+, sem dependências externas. Cliente nativo, servidor HTTP, catálogo compartilhado e motor funcional de regras. Escolha deliberada para permitir executar imediatamente e validar design antes de comprometer o projeto com infraestrutura maior. Não pressupõe banco de dados ou serviços pagos.

Fluxo: interface envia intenção → servidor identifica participante → verifica versão e turno → motor valida e calcula novo estado → servidor executa rival automático quando necessário → resposta filtrada por participante → interface renderiza. A função `applyAction` clona o estado e não altera o original ao rejeitar uma ação. A aleatoriedade só entra no embaralhamento inicial e pode ser injetada para testes.

## API atual

JSON em todas as rotas. Credencial de desenvolvimento: `Authorization: Bearer <id do perfil>`. Esse id é secreto, não um nome público. Não substitui autenticação de produção.

| Método e rota | Entrada | Saída |
| --- | --- | --- |
| GET /api/health | — | Saúde e versão |
| POST /api/profile | `{name, faction}` | Perfil, deck inicial, coleção e credencial local |
| GET /api/profile | Bearer | Perfil, moedas, fragmentos, contratos, coleção e decks |
| POST /api/boosters/open | Bearer | Debita Marcas e entrega 5 cartas/Fragmentos da Edição I |
| POST /api/cards/craft | `{cardId, amount}` | Cria carta com Fragmentos ou equipamento com Marcas + Sucata |
| POST /api/items/repair | `{itemId}` | Restaura durabilidade fora de sala/anúncio |
| GET /api/market | Bearer | Ofertas ativas e inventário do jogador |
| POST /api/market/list | `{itemId, price}` | Anuncia item não vinculado e não reservado |
| POST /api/market/:listingId/buy | — | Compra e transfere a peça com imposto |
| POST /api/market/:listingId/cancel | — | Retira oferta do vendedor |
| POST /api/decks | `{name, faction, cards}` | Cria lista a partir de cartas possuídas |
| PUT /api/decks/:id | `{name, cards}` | Valida e salva lista |
| POST /api/decks/:id/activate | Bearer | Equipa a lista para a facção |
| POST /api/rooms | `{faction, mode, deckId, riskMode}` | Sala e visão privada; risco vale em duelo |
| POST /api/rooms/:id/join | `{acceptRisk}` | Ocupa segunda vaga e confirma risco quando exigido |
| GET /api/rooms/:id | Bearer de participante | Estado filtrado |
| POST /api/rooms/:id/actions | `{version, action: {type: "play", uid, lane}}` ou `{version, action: {type: "pass"}}` | Estado após ação e bot |
| GET /api/realms | Bearer | Estado pessoal, atlas, Casas, crônicas e presença recente |
| POST /api/realms/actions | `{version, type, ...dados}` | Viagem, coleta, repouso, construção, avatar, Casa, política, contribuição ou guerra |
| POST /api/realms/encounter | `{version}` | Abre encontro da região e reserva o deck/equipamentos |

Frentes: `court`, `crypt`, `hunt`. Erros de regra retornam 400, credencial ausente 401, acesso de não participante 403, recurso inexistente 404, versão defasada 409. Baralho ordenado nunca sai do servidor; mão rival é substituída pela contagem. A interface compartilha o catálogo público e a função de cálculo de poder, não autoridade de decisão.

Ações adicionais: `{type:"attack",uid,lane,target}`; `{type:"skill",lane,target}`; `{type:"ultimate",lane,target}`. `target` é o UID de uma unidade ou `"hero"`. Cartas de equipamento/ritual aceitam `target` para seleção individual; a omissão mantém o primeiro alvo válido como compatibilidade para o bot. O servidor valida propriedade, frente, recursos, estado de ataque, capacidade de equipamento e uso por rodada. `concede` está disponível no motor para o ator atual, mas ainda não é um fluxo na interface.

### Inventário e reservas

Cartas regulares são contadores por `cardId`; equipamento é `InventoryItem` com id único, `cardId`, raridade, durabilidade máxima/atual, vínculo, origem, datas de criação e campos de anúncio. Uma vaga de equipamento salva no deck guarda apenas `cardId`. Ao criar/entrar em uma sala, `reserveDeck` vincula uma instância compatível a cada vaga e mantém seus ids em uma trava transitória da sala. O motor recebe `{cardId,itemId,itemBound}`; a resposta do dono pode mostrar a condição da peça, enquanto a visão rival recebe apenas a identidade pública da carta.

`settleGear` roda uma vez no resultado final: peças em unidades mortas aplicam 2 de desgaste e as demais peças equipadas aplicam 1. Em Juramento de Sangue, o primeiro equipamento não vinculado de uma unidade abatida é elegível para transferência; o atacante recebe a peça com desgaste. A peça equipada no líder derrotado também é elegível quando houver vencedor. Quebra remove a instância e converte raridade em Sucata. A sala libera as travas após liquidar. O mercado só aceita peças com durabilidade, fora de sala e sem vínculo; compra transfere a instância e liquida Marcas com imposto.

`view` envia ao cliente apenas o resumo de recompensa da própria cadeira (XP, Marcas, Fragmentos, Sucata, quantidade de peças, quebras e saques). Identificadores privados de itens não aparecem em ofertas ou eventos públicos.

Eventos de combate possuem `id` crescente, `type`, assento e alvo/frente conforme aplicável. Uma janela dos últimos 180 eventos viaja com o snapshot. A interface consome apenas IDs novos, bloqueia entrada durante os efeitos e mantém as regras no servidor. Esse fluxo é feedback visual sobre o snapshot final, não replay completo de estados intermediários.

Retomada: o código da última sala fica em `sessionStorage`; o perfil permanece em `localStorage`. Atualizar a página retorna ao refúgio, onde o botão de retomada recupera o estado da sala. Perfis legados recebem uma migração única para deck inicial, coleção e moedas. Recompensa de partida é aplicada uma vez por sala; desistência não recebe prêmio. Decks entram na sala por lista de IDs validada contra a coleção.

O protótipo grava perfis, inventários, mundo, Casas, territórios e salas em um snapshot JSON atômico. Ao reiniciar, salas inacabadas e travas de itens são restauradas; no MVP, isso funciona em **um processo e uma instância**. A presença expira após 45 segundos sem atualização. O mundo parece simultâneo para os jogadores ligados à mesma instância; ainda não há sincronização entre servidores nem garantia transacional contra queda no instante da liquidação. Produção exige banco transacional e identidade idempotente de resultado.

### Reinos de Véspera — regras do MVP

O avatar começa no Porto das Cinzas com 20 provisões, nível de exploração 1 e acampamento nível 1. O atlas tem onze regiões conectadas; viajar custa 1 provisão e regiões de nível superior exigem progresso. Coletar custa 1 provisão, dá 3 recursos com acampamento inicial e espera 60 segundos por local. Repousar custa 10 Marcas e devolve 8 provisões, respeitando o limite ampliável do acampamento.

Forja e biblioteca convertem minério/essência em Sucata/Fragmentos; melhorias consomem Marcas e materiais. Casas aceitam até vinte jogadores da mesma facção. Fundar custa 100 Marcas. O fundador propõe uma política e votações usam maioria simples; guerra custa 50 Marcas do tesouro e dura trinta minutos. Cada região de fortaleza/capital requer três vitórias remuneradas para conquista neutra; bastião do defensor requer quatro, e território conquistado recebe dez minutos de trégua. A política de Expedição dá 1 material adicional, Comércio dá 5 Marcas na primeira vitória elegível por etapa/local, Bastião eleva o limiar de defesa.

Um encontro de mundo custa 2 provisões e usa o deck ativo real do jogador. Vitória dá de 40 a 60 XP conforme o nível do lugar, 10 Marcas, materiais e influência. A recompensa de exploração por lugar/etapa tem intervalo de cinco minutos; uma dungeon dura três mesas e pode render um equipamento ao completar o chefe. A derrota encerra a expedição atual, sem apagar nível, construções ou territórios. Equipamentos seguem as regras globais de desgaste e quebra.

Escopo honesto: a região existe como mapa persistente com mesas instanciadas 1×1 contra IA, Casas e presença compartilhadas na mesma execução do servidor. Não há combate simultâneo em tempo real, canal social, travessia entre instâncias, servidor distribuído, PvP territorial contra outro deck humano ainda, nem banco de produção. É a fundação jogável para esses próximos serviços, não um MMO publicado.

## Próxima evolução proposta

- Cliente: migrar para TypeScript e React/Vite quando o fluxo de jogo estiver validado; preservar regras em pacote independente. Animação renderiza eventos, sem inferir a verdade do jogo.
- API: TypeScript com validação de esquema, autenticação real, limites de requisição e tratamento uniforme de erros.
- PostgreSQL: contas, coleções, decks, inventário, resultados, progressão, contratos e razão de recompensas.
- Redis: filas de matchmaking, presença e coordenação transitória se houver necessidade de múltiplos processos.
- WebSocket: snapshots iniciais, eventos ordenados, reconexão por sequência e ACK. Manter ações com idempotency key e versão.
- Motor: eventos determinísticos, semente privada, versão de regras e replay auditável. Nunca enviar seed ou ordem do deck durante a partida.
- Operação: contêineres, TLS, backups restauráveis, métricas, logs sem credenciais e alertas de corrupção de partida.

Modelo de dados sugerido: Account → PlayerProfile; CardDefinition versionada; OwnedCard; Deck → DeckSlot; Match → Participant / Action / Snapshot / Result; InventoryItem; RewardLedger com chave única por origem. Itens de partida e itens da conta são entidades separadas.

## Antes de publicar

Autenticação e autorização reais, HTTPS, limitação de criação de perfis/salas, expiração de salas, recuperação após falha do servidor, abandono com prazo, validação transacional de XP e economia, testes de concorrência e cargas reais. A retomada atual depende da memória do processo. O protótipo não deve ser exposto publicamente como serviço comercial.

## Estratégia de verificação

Testes de regras: autoridade do turno, custos, ocupação, simultaneidade, recompensas, equipamento, encerramento e sigilo. Simulações: partidas completas com estados válidos. Teste de API: criar dois perfis, entrar na sala, negar terceiro participante, conferir sigilo e rejeitar versão antiga. Próximo estágio: testes de reconexão, concorrência real, replay e regressões de cartas.
