# Jornada do jogador — FTUE e descoberta progressiva

A experiência inicial usa FTUE (First Time User Experience), onboarding contextual, feature gating e progressive disclosure. O objetivo é ensinar uma decisão de cada vez e preservar uma rota solo viável.

## Contas novas

| Batalhas concluídas | Novos sistemas |
| --- | --- |
| 0 | Deck inicial, treino prático, caçada, Arsenal e preparação/reparo |
| 1 | Construção de decks, boosters e contratos |
| 2 | Dungeon e forja |
| 3 | Reinos e cofre |
| 4 | Comércio e encomendas |
| 5 | Matchmaking online |
| 6 | Casas e política |
| 12 | Segunda linhagem |

Vitórias e derrotas contam. Desistências e exercícios de treino não contam. Estes marcos introduzem sistemas; não substituem os requisitos de nível, materiais e capítulos já existentes nos Reinos. Não exigem compras, PvP ou uma sequência de vitórias. O jogador recebe recursos iniciais para ter um deck jogável; a progressão não começa sem meios de jogar.

## Começo, meio e fim

1. Primeiro juramento: criação, treino de nove exercícios e primeira caçada.
2. Além dos portões: gestão de relíquias, dungeon e descoberta dos Reinos.
3. Soberania: progressão pelos capítulos e desenvolvimento do domínio, com política opcional.
4. Legado: após os oito capítulos principais, histórias, troféus, coleção, exploração e disputas permanecem disponíveis. Não é uma campanha procedural infinita.

Há 18 guias contextuais, mapa de desbloqueios, destaque do controle relevante, opção de pausar/rever e retomada dos exercícios práticos. O estado fica no perfil persistido pelo servidor (incluindo MongoDB quando configurado). As restrições de acesso são validadas na API, além da apresentação visual.

Contas anteriores à implementação mantêm acesso. Sem wipe ou retirada de inventário. Para experimentar o começo gradual, use uma conta nova. Os limiares ficam centralizados em shared/player-journey.js.

## Apresentação e economia

O cofre usa uma simulação local 2.5D com moedas ilustradas, colisões, gravidade e arraste. Até 64 moedas representam o volume visual: o saldo numérico continua sendo a autoridade. Arrastar não transfere recursos. Depósito e retirada seguem a validação transacional existente. Simulação pausa em segundo plano e em repouso; textura é reduzida uma vez para evitar redesenhar a imagem original a cada moeda.

Ajuda de moedas e XP foi integrada aos respectivos indicadores; explicações de preparação ficam agrupadas. O START utiliza start_button_sfx.mp3.
