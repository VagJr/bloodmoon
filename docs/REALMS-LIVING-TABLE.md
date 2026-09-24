# Mesa viva de Reinos e economia — implementação

Economia: booster de cinco cartas por 300 Marcas. Contas novas recebem um deck e 60 Marcas; segunda linhagem após 12 partidas. Contratos recorrentes: 8 partidas, 30 abates e 5 vitórias. Inventários existentes preservados. Não há compra obrigatória para jogar. A velocidade de coleção ainda precisa de telemetria real; não se promete um tempo exato para completar a edição.

Reinos: mesa de 8000 × 5000, arraste por mouse/toque, zoom, minimapa, seleção de cartas e ações nos três espaços de cada região. UI de mapa com cenário dominante, retrato lateral, barra inferior e painel compacto de destino. Arena preservada.

Postos custam 30 Marcas, 4 madeiras, 3 minérios; máximo três por jogador; expiram em sete dias. Não consomem a carta. Catacumbas produzem um material a cada dez minutos, limite seis. Corte prepara dois pontos de influência em território neutro: a conquista exige vitória em expedição. Caçada reduz dano de cerco nos outros postos da mesma Casa. Cerco só entre Casas em guerra, respeitando proteção territorial.

Ordens custam 15 vigor; regeneração de um a cada 30 segundos; dez segundos entre ordens. Raids de dungeon têm 240 HP compartilhados, ciclos de seis horas e contribuição mínima de dois ataques para receber 30 Marcas e seis materiais uma única vez. São incursões cooperativas assíncronas; as expedições táticas existentes continuam separadas.

Estado validado no servidor e persistido no armazenamento existente. SSE autenticado avisa alterações do mundo; leitura de estado é limitada no cliente e a consulta periódica continua como recuperação. Não é simulação de combate contínuo em 3D, nem infraestrutura validada para milhares de jogadores. O processo atual mantém mundo em memória e serializa escritas: múltiplas instâncias, presença distribuída, particionamento espacial e testes de carga permanecem necessários antes de chamar este modo de MMO massivo completo. Não foi feito deploy ou wipe.
