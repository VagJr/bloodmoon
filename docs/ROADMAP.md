# Estado do projeto · Bloodmoon 0.5

## Entregue nesta etapa

- Coleção Edição I: 100 cartas de facção (50 vampiros, 50 lobisomens), 60 equipamentos e 1 carta neutra de dungeon.
- Booster Crônicas de Véspera: pacote oficial ilustrado, abertura animada, cinco cartas reveladas individualmente ou em grupo e inspeção da carta resultante.
- Arsenal e Decks: busca por nome/efeito/sinergia, filtro de propriedade, face de carta consistente, inspeção detalhada e ampliação da ilustração sem esticar a imagem.
- Reinos de Véspera: onze regiões conectadas, atlas e campos ilustrados, viagem, provisões, coleta, construções e conversão de recursos; perfil do reino persistente.
- Casas da mesma facção, tesouro, voto de política, guerra temporária, influência e conquista territorial.
- Expedições solo com o deck ativo, mesas de combate por região e dungeon de três encontros; recompensas de XP, materiais, Marcas e equipamento persistente.
- Navegação dos menus fora de combate redesenhada com painéis em profundidade e molduras de jogo. O tabuleiro de combate mantém sua composição; efeitos, estado e regras existentes continuam no motor do servidor.
- Arte pronta catalogada; arte ainda não produzida tem protótipo visual e fila específica para os próximos lotes.

## Arte da Edição I

Use `docs/art/pending.json` como fonte atual de pendências e `docs/art/sheets.json` para composição futura em folhas 4×4. Cinco folhas existentes forneceram 80 recortes; mais 11 cartas têm ilustração individual, totalizando 91 cartas com arte original registrada. **Setenta cartas ainda usam arte provisória**; o jogo marca isso durante a inspeção. O gerador de recortes preserva a imagem original e não inventa arte.

O pacote oficial, o mapa do reino, quatro ambientes, seis avatares e as artes existentes estão em `client/assets`. Não foram solicitadas nem iniciadas novas gerações nesta etapa. Para o próximo lote, gerar primeiro as 70 entradas pendentes como folhas 4×4 na direção documentada em `docs/art/generation-manifest.json`, conferir a folha inteira e então rodar `scripts/prepare_art.py`.

## Limites de execução

Este é um protótipo em Node, sem autenticação real. Com `MONGO_URI`, perfis, inventário, salas e mundo persistem no MongoDB Atlas em uma base configurável (padrão `bloodmoon`); o modo JSON permanece como fallback local para testes. Presença, política e economia são compartilhadas somente entre sessões da mesma instância do servidor. Combate de Reinos usa adversário IA por agora; combate entre jogadores acontece no modo de duelo por sala. Tratar todo preço como moeda do jogo; não existe dinheiro real.

## Próximos marcos

1. Completar as 70 ilustrações pendentes em lotes aprovados, conferir leitura em miniatura e atualizar o manifesto.
2. Playtest dos arquétipos e economia com jogadores; medir resultado por deck/facção, dano, duração, escolhas de carta, desgaste, reparos e moedas antes de rebalancear a coleção.
3. Transformar encontros de Reinos em conteúdo PvE persistente, com rota/recompensa opcional, saúde e condição do equipamento entre mesas; expandir eventos e contratos de Casas.
4. Para multiplayer público: autenticação, gravações por entidade e coordenação multi-instância, idempotência de recompensa, WebSocket/presença distribuída, moderação, proteção contra abuso, reconexão, métricas e operação.

Não declarar a economia nem as 161 cartas equilibradas sem partidas humanas e telemetria. A régua atual orienta construção de decks e orçamento; os testes determinísticos provam regras e estados, não substituem playtest.
