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

O servidor avança o mundo a cada 250 ms. Movimentos são ordens de direção e duração limitada, com sequência crescente e limite temporal no servidor; o cliente não escolhe livremente uma posição final. O navegador interpola o movimento e recebe estados autenticados por SSE, com consulta periódica como recuperação. Atualizações do mapa não recriam a tela inteira.

Ordens que gastam recursos são serializadas com as demais mutações do jogo. Movimento e simulação são gravados em lotes; ações econômicas e abertura/conclusão de salas usam a persistência existente. O encerramento normal do servidor descarrega as alterações pendentes. Uma interrupção abrupta pode perder os últimos segundos de movimento.

## Combate de ação e defesas

Os golpes do viajante possuem preparação antes do contato. Magias viajam como projéteis; o servidor testa o segmento percorrido entre atualizações, impedindo que uma velocidade alta atravesse corpos e obstáculos sem registrar a colisão. A direção é definida ao lançar: o alvo pode sair da trajetória. Explosões respeitam obstáculos entre o impacto e a vítima.

- **Guarda de ferro:** escudo frontal com resistência finita e duração de três segundos. Protege contra dano físico e mágico; ataques pelas costas continuam perigosos. Dano excedente pode quebrar o escudo.
- **Contraguarda:** counter físico com janela de 650 ms. Um contato frontal válido interrompe e atordoa o atacante.
- **Espelho do Véu:** counter mágico com janela de 800 ms. Intercepta e devolve um projétil ao lançador.
- **Passo espectral:** cancela a preparação do próprio ataque e concede 500 ms de esquiva. O deslocamento termina antes de atravessar um corpo ou obstáculo sólido.

As defesas podem cancelar a preparação de um golpe; custos e recargas já pagos não são devolvidos. Os inimigos exibem avisos antes de atacar. Saqueadores arcanos têm preparação mais longa e disparam à distância. A Arena mantém seu motor, controles e apresentação próprios.

`shared/realm-action-combat.js` resolve os contatos, defesas e ataques pendentes. `liveWorld.combat` publica somente as entidades necessárias à apresentação: projéteis, barreiras, preparações e obstáculos. O cliente desenha essa geometria e os efeitos no canvas; os efeitos não determinam o dano.

## HUD mobile e sensação tátil

O HUD de Reinos reúne vida, mana, vigor, alvo, habilidades e defesas. O Códice dá acesso ao personagem, grimório, conselho e mapa, além das páginas existentes de gestão. Os controles se adaptam a telas verticais e horizontais e às margens de segurança do aparelho.

O feedback tátil tem três opções persistentes: desligado, suave (padrão) e intenso. Ataques, críticos, dano recebido, bloqueios, counters e quebra de guarda têm ritmos diferentes. Os padrões respondem aos eventos confirmados do próprio viajante, com deduplicação, prioridade e intervalo mínimo; eventos de outros jogadores e eventos antigos não vibram o aparelho. A vibração para quando a página fica oculta, ao sair de Reinos ou ao desligar a opção.

A integração utiliza `navigator.vibrate`, que depende de interação prévia e de suporte no navegador e no aparelho. A API web ajusta a duração dos pulsos, não a potência física do motor. Navegadores sem suporte continuam com o mesmo feedback visual e sonoro. Referência: [MDN — Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

## Limites desta implementação

Este é um mundo multiplayer persistente no processo atual do jogo. Não houve validação para milhares de jogadores simultâneos. Antes de operar como MMO massivo, ainda é necessário particionar o mundo, coordenar múltiplos servidores, limitar atualizações por área de interesse e medir carga real. A simulação não mantém o serviço ativo quando o provedor de hospedagem o suspende.

O combate do mapa tem regras próprias de tempo real; os encontros de Arena mantêm o combate tático original. Balanceamento, ritmo de progressão e escala precisam de sessões de jogo e medição em produção.

A física de combate usa volumes e trajetórias 2D no mapa, com sua proporção 3:2. Não é uma simulação de corpos rígidos 3D. Latência de rede ainda afeta a janela percebida dos counters; a confirmação final vem do servidor. A vibração precisa de teste sensorial em um celular real: uma prévia desktop valida os eventos e controles, mas não reproduz o motor háptico.
