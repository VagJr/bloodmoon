# Mercado, leitura de cartas e conclusão da arte

## Entrega de arte

161 cartas possuem arquivo mapeado, existente e de conteúdo distinto. Foram preservados os 91 arquivos anteriores e adicionadas 70 artes de cartas, 11 objetos de mercado e um cenário exclusivo. A lista abaixo identifica as 70 lacunas encerradas; não significa que todas as ilustrações anteriores foram redesenhadas.

As cinco folhas originais estão em client/assets/sheets/completion-N.png; versões organizadas em grade 4×4 usam o sufixo -grid. A folha 3 gerou uma célula extra; o recorte foi corrigido manualmente para não deslocar as associações. completion-crops.json registra a associação definitiva, origem, dimensões e limites de cada recorte. Nenhum arquivo anterior foi sobrescrito.

As folhas foram entregues pelo gerador em 1254×1254. Os recortes preservam a resolução nativa e a proporção, sem ampliação artificial; uma edição de ilustrações individuais em alta resolução continua sendo um trabalho separado.

- Sentinela dos Sete Caixões — casketwarden
- Carrasca do Manto Negro — velvetexecutioner
- Duque dos Salões Ocos — dukeofhollows
- Porta-Voz da Fortaleza Velha — keepspeaker
- Advogada Pálida — paleadvocate
- Acólita da Sede Longa — thirstingacolyte
- Capitã da Lâmina Rosa — rosebladecaptain
- Mensageiro Nascido da Cripta — graveborncourier
- Arquiduque das Feridas — bloodarchon
- Livro dos Sussurros Devidos — whisperedledger
- Édito da Câmara Escarlate — rededict
- Fio Rubro — bloodthread
- Pulso Reaceso — quenchedpulse
- Convocação dos Corvos — ravensummons
- Quietude Final — quietus
- Poço do Crepúsculo — duskwell
- Emboscada da Noite Longa — nightfallambush
- Reivindicação Ancestral — ancestralclaim
- Broquel de Freixo — ashwoodbuckler
- Laço Carmesim — crimsonlariat
- Gorgete de Prata Fria — wolfsilvergorget
- Adaga Votiva — votivedagger
- Escudo de Vidro Negro — blackglasskite
- Corrente dos Nove Votos — chainofninevows
- Esporas de Luto — mourningspurs
- Manopla da Pedreira — quarrygauntlet
- Manto de Brasa Fria — cindermantle
- Anel de Espinhos Jurados — thornring
- Talismã da Lua Morta — oldmoontalisman
- Chave do Ossuário Sul — gravekey
- Braçadeira de Raiz de Ferro — ironrootbracer
- Moeda do Dízimo Rubro — bloodcoin
- Alfinetes do Coro Mudo — seraphpins
- Coroa de Sebo Negro — tallowcrown
- Escudo do Nicho Vazio — hollowshield
- Gancho da Urze — briarhook
- Faixa de Ossos Alvos — bonesash
- Relicário do Cão-Lobo — wolfhoundlocket
- Agulha da Viúva Rubra — redwidowneedle
- Manopla de Aparar Ébano — ebonparry
- Cálice do Banquete Velado — feastchalice
- Lâmina Mata-Reis — kingsbane
- Arco de Chifre Lunar — moonshotbow
- Sobrepeliz das Cinzas — ashenchasuble
- Bússola do Ocaso — duskcompass
- Berrante da Alcateia Velada — packhowlhorn
- Cota de Espinhos Profundos — thornmail
- Botas da Colina Tumular — barrowboots
- Espelho Partido de Véspera — rivenmirror
- Fio da Donzela Espectral — wraiththread
- Broquel da Raiz Anciã — elderroot
- Selo da Câmara Escarlate — scarletseal
- Presa da Soberana Noturna — sovereignfang
- Fio da Lua Partida — moonsplitedge
- Coração de Mordrath — mordrathheart
- Lente do Pacto Profundo — covenantlens
- Glaive da Ruptura — ruptureglaive
- Esporas Presas à Brasa — emberboundspurs
- Véu de Vesper — vesperveil
- Estandarte do Fogo da Matilha — packfirepennon
- Gancho do Quebra-Juramentos — oathbreakerhook
- Maça da Aurora Negada — dawnlessmace
- Égide Sem Coroa — crownlessaegis
- Par de Lâminas do Eclipse — eclipseduelists
- Manto de Seda da Viúva — silkwidowcloak
- Escritura do Vazio Rubro — redhollowscripture
- Coração da Primeira Matilha — heartoffirstpack
- Mandíbula do Crepúsculo — mawofgloam
- Torque do Sangue Lunar — bloodmoontorque
- Placa do Rei do Gloaming — gloamkingsplate

## Economia funcional

- Cofre persistente: transferências conservam o total entre bolsa e banco; versão impede repetir um depósito concorrente. Histórico limitado a 20 movimentos. Não há juros nem emissão de moeda.
- Comércio existente de anúncios continua disponível. Encomendas são ofertas de compra de equipamentos: reserva imediata do valor; até três por comprador; máximo global de 200.
- Entrega exige peça livre, negociável e totalmente reparada. A peça muda de proprietário uma única vez. Imposto de 7% sobre a venda. Cancelamento devolve a reserva uma única vez.
- Peças vinculadas, anunciadas ou reservadas em partidas não podem atender encomendas. O preparo dos decks é reconciliado após a transferência.
- Encomendas não expiram automaticamente. Não há troca direta por escambo nesta entrega; comércio acontece por anúncios e encomendas em Marcas.
- Forja, reparo e preparação usam os mesmos itens e regras do combate e de Reinos, sem inventário paralelo. Cofre, comércio, encomendas, Relicário e forja têm estações próprias; prateleiras exibem seis itens por página.

## Leitura e interação

- Prévia de computador compacta: arte à esquerda, texto com quebra de linhas e resumo de cada selo à direita; detalhes extensos ficam na inspeção explícita.
- Toque suprime o hover emulado do navegador. A mão usa uma única prévia; deslizar troca a carta, soltar mantém a seleção no mesmo painel e iniciar arrasto esconde a leitura.
- Consultas continuam disponíveis na resolução do turno; as ações continuam sob as travas normais da engine. Painéis de leitura não devem executar comandos de combate.
- Qualquer início de interação recolhe prévias anteriores; Escape também as fecha. Ficha RPG flutuante recolhe ao interagir com a mesa. Janelas explícitas conservam fechamento próprio.
- Diálogos limitados ao viewport com conteúdo interno acessível. Não se afirma que todos os menus foram convertidos para um motor 3D: o mercado usa ilustração, perspectiva CSS e animação.

## Som e limites

Novas camadas procedurais para navegação, moedas, reparo e forja, respeitando a preferência de áudio. São sons sintetizados; não uma biblioteca de Foley gravada em estúdio. A produção cinematográfica completa de áudio e todos os menus do jogo não está certificada como AAA.

## Verificação

Testes de regras, API, concorrência de depósito, autorização/cancelamento de encomendas, conservação de moeda, transferência única de itens e cobertura das artes. Verificação visual local de mercado, depósito, prévia de carta e viewport de 390×844; nenhuma migração, limpeza ou publicação no banco de produção.

