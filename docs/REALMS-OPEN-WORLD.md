# Reinos de Véspera — mundo aberto

O mapa de Reinos passa a ter um personagem controlável, posições contínuas, encontros locais e população autônoma. A identidade continua sendo a de Bloodmoon: um tabuleiro de fantasia sombria em que cartas, frentes de combate, linhagens e Casas determinam as decisões.

## Jogabilidade

- **Exploração:** WASD, setas ou controle de toque movem o personagem. A câmera acompanha o viajante, com arraste, zoom e atlas para orientação. As regiões são descobertas pela presença no mapa.
- **Cartas no terreno:** espaços possuem funções de construção, produção, armamento, armadilha e linha de frente. Posicionamento, proximidade, recursos e cartas disponíveis são validados no servidor.
- **Combate local:** criaturas circulam e combatem no próprio mapa. Tropas destacadas e defesas participam da simulação; vida, energia, recuperação e recompensas pertencem ao mundo persistente.
- **Encontros de Arena:** chefes, dungeons e duelos usam o motor, as cartas, os alvos e a apresentação da Arena existente. O personagem fica bloqueado no mundo durante a partida.
- **PvP:** um jogador próximo envia um desafio; o outro precisa aceitar. Os dois decks são validados e as peças reservadas antes de abrir a mesma sala. O duelo usa o Pacto, com desgaste de equipamento, sem transferência de peças.
- **Vida autônoma:** habitantes das duas linhagens, patrulhas, caravanas, criaturas e invasões mantêm atividades disponíveis para quem joga sozinho.
- **Gestão:** o Domínio, as Casas, os tesouros, a votação de políticas, as guerras e a conquista territorial continuam acessíveis pela navegação de Reinos. Materiais, Marcas e recompensas usam a economia já existente.

## Estado e conexão

`shared/realm-world.js` concentra regras e simulação. O estado compartilhado fica em `world.realmWorld`; a condição e posição do viajante ficam em `profile.realm.roaming`. Os dados anteriores de progressão e política são preservados.

O servidor avança o mundo a cada 500 ms. Movimentos são ordens de direção e duração limitada, com sequência crescente e limite temporal no servidor; o cliente não escolhe livremente uma posição final. O navegador interpola o movimento e recebe estados autenticados por SSE, com consulta periódica como recuperação. Atualizações do mapa não recriam a tela inteira.

Ordens que gastam recursos são serializadas com as demais mutações do jogo. Movimento e simulação são gravados em lotes; ações econômicas e abertura/conclusão de salas usam a persistência existente. O encerramento normal do servidor descarrega as alterações pendentes. Uma interrupção abrupta pode perder os últimos segundos de movimento.

## Limites desta implementação

Este é um mundo multiplayer persistente no processo atual do jogo. Não houve validação para milhares de jogadores simultâneos. Antes de operar como MMO massivo, ainda é necessário particionar o mundo, coordenar múltiplos servidores, limitar atualizações por área de interesse e medir carga real. A simulação não mantém o serviço ativo quando o provedor de hospedagem o suspende.

O combate do mapa tem regras próprias de tempo real; os encontros de Arena mantêm o combate tático original. Balanceamento, ritmo de progressão e escala precisam de sessões de jogo e medição em produção.
