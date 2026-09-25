# Reinos de Véspera — novas províncias

Dez fundos de mapa finais, gerados com o ImageGen integrado e convertidos para WebP (qualidade 85). Cada fundo mede **1672 × 941 px**; cada miniatura `-thumb.webp` mede **320 × 180 px** (qualidade 78). Os fundos são pintura de terreno sem texto, HUD, pins ou personagens. A estrada principal atravessa o eixo oeste–leste; ramificações levam aos marcos e deixam clareiras para a camada interativa. As bordas têm terreno ambiental, sem molduras ou recortes circulares. Biomas vizinhos têm mudanças naturais de cor; aplicar transição suave na composição visual entre regiões.

| Ordem | ID / arquivo em `/assets/world/maps/` | Faixa X do mundo | Composição e marcos para sobreposição |
| --- | --- | --- | --- |
| 1 | `gloamwood.webp` | 300–420 | Floresta de névoa; povoado madeireiro na rota, pilhas de toras e clareiras; ruína e cogumelos ao sul. |
| 2 | `glassfen.webp` | 420–540 | Pântano espelhado; calçadas e pontes secas no centro, templo lunar ao norte, ilhas de ervas e ruínas afogadas ao sul. |
| 3 | `ironspine.webp` | 540–660 | Passos de minério; vila mineira e vale aberto no centro, minas/forjas nas encostas, grande pedreira ao sul. |
| 4 | `sunken-city.webp` | 660–780 | Necrópole alagada; espinha de pontes e praças secas, catedral e canais, entrada de cripta ao sul. |
| 5 | `nightmarket.webp` | 780–900 | Cidade mercantil gótica; praças de mercado, cais, guildas, oficinas e campos periféricos conectados. |
| 6 | `white-abbey.webp` | 900–1020 | Planalto nevado; abadia no alto, vila de peregrinos, lago congelado e entradas de cripta ao sul. |
| 7 | `thornwild.webp` | 1020–1140 | Floresta lupina; campina de caça central, círculo de pedras ao norte, covis e recursos de mata ao sul. |
| 8 | `obsidian.webp` | 1140–1260 | Terras vulcânicas; posto oeste ~10%/50%, fortaleza ~40%/25%, caverna-forja ~50%/75%, posto leste ~80%/50%. |
| 9 | `starfall.webp` | 1260–1380 | Campos de impacto; entrada oeste ~10%/50%, observatório ~40%/25%, caverna de cristais ~50%/75%, povoado ~80%/50%. |
| 10 | `eclipse-throne.webp` | 1380–1500 | Capital imperial; fronteira oeste ~10%/50%, palácio ~40%/25%, ruína de cerco ~50%/75%, portão leste ~80%/50%. |

Miniaturas seguem o mesmo ID (`gloamwood-thumb.webp`, etc.). O prompt de produção comum foi: mapa amplo de mundo aberto de fantasia gótica em perspectiva aérea/isométrica alta, pintura semirrealista detalhada, arquitetura pequena perante a geografia, rota navegável oeste–leste e espaços centrais para tokens, luz de lua e fogos pontuais, sem interface ou tipografia. O complemento de cada prompt é a composição descrita na última coluna. A arte serve como terreno; limites de colisão, recursos, inimigos e interações devem seguir os dados de jogo, não pixels da pintura.
