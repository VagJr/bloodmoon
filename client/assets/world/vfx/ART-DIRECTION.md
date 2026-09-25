# Bloodmoon VFX sheets

The ten supplied 1254 × 1254 RGBA sheets are preserved as lossless WebP atlases in this folder. Each is an exact 6 × 6 grid with 209 × 209 pixel cells. The original PNGs remain in the project root. These are collections of distinct effects, not six-frame strips: `realm-vfx.js` selects a visually matching cell and animates it in the world with timed scale, rotation, glow, additive afterimages, impact rings, and sparks.

## Visual families and game use

- `blood-slash.webp` — crimson claw cuts, blade arcs, and blood streaks. Use for strike, cleave, and close melee actions.
- `moon-silver.webp` — cold silver-blue crescents, crossings, and movement trails. Use for dodge, pounce, and lunar defenses.
- `ember.webp` — hot orange-red flares and burst shapes. Use for fire and broad area attacks.
- `blood-orbits.webp` — dark blood cores, circular surges, and crimson projectiles. Use for blood spells and ranged blood attacks.
- `violet-arcana.webp` — violet spell forms. Use for healing, renewal, and arcane recovery.
- `moon-frost.webp` — ice-blue blades, shards, and frost impacts. Use for frost spells and cold control effects.
- `crimson-sigils.webp` — ritual circles and blood seals. Use for draining, vows, influence, and wards.
- `blood-impact.webp` — red hit bursts, star impacts, and decisive strikes. Use for hit confirmation, critical hits, and executions.
- `blood-ward.webp` — crimson barrier, shield, and rune forms. Use for guards and protective effects.
- `pixel-legacy.webp` — deliberately pixel-art weapons, dust, and elemental effects. It is kept intact for a future retro presentation; its pixel language does not match the current painted VFX families, so the core action system does not mix it into these effects.

The runtime maps individual abilities to themed sheets in `client/realm-vfx.js`; impact variants are separate from the attack animation so a hit can layer its own confirmation. Sound cues use the existing Arena sound library through `playSound`, with separate pools for vampire and werewolf melee, steel clashes, blood magic, lunar spells, wards, healing, and incoming damage.

Do not bake backgrounds, characters, UI, labels, or additional grid lines into these atlases. Preserve source files and the equal 6 × 6 crop when replacing or adding a sheet.

# Vigília do Reino — folhas e animação em combate

As seis folhas adicionadas em `assets_visuais` foram recortadas sem margens em quadros individuais e recombinadas em tiras WebP por tema. `frames/manifest.json` registra a origem e os quadros usados; os PNGs originais permanecem intactos. As tiras publicadas ocupam cerca de 3,2 MB no total, contra dezenas de megabytes carregando as folhas completas.

- `vampire-omens`: gotas, pacto de sangue e emblemas das habilidades; também fornece os ícones recortados em `assets/world/ability-icons/`.
- `moon-rites`: círculos lunares, guardas e marcas de área.
- `realm-slashes`: arcos de lâmina, garras e rastros de movimento.
- `card-rites`: cura, relíquias e marcas de recompensa.
- `storm-magic`: gelo, fogo e descargas para projéteis e Eclipse.
- `gothic-rites`: selos, correntes e ritos de execução.

O HUD prepara os atlas no início da vigília. Cada ação sobrepõe a arte original compatível com a sua animação (corte, avanço, guarda, cura, projétil ou explosão) e uma marca de impacto, com composição aditiva, deslocamento, rotação, expansão, brilho e dissipação. O d20, os sons de combate e os efeitos táteis continuam ligados ao mesmo evento; resultados de lobisomem puxam a luz para prata e azul, enquanto a magia vampírica mantém o carmesim.

## Nova biblioteca de oito folhas

`scripts/build-realm-sheets2.py` recorta as oito folhas fornecidas em `assets_sheets2/` sem modificar as originais. As tiras compactas em `frames/` e os recortes isolados em `sheet-details/` somam cerca de 1,5 MB. O arquivo `sheet-details/manifest.json` registra cada célula de origem.

- `blood-court` e `wolf-rites` entram nos golpes, rituais e auras de vampiros e lobisomens.
- `blood-architecture` e `moon-architecture` fornecem portais e construções incorporados aos territórios.
- `blood-atmosphere` e `moon-atmosphere` animam faíscas, cinzas, neblina e clima dos mapas e impactos.
- `vampire-frame` e `werewolf-frame` fornecem quatro insígnias por linhagem, do branco ao vermelho, preto e dourado. O mesmo grau aparece no retrato, no mapa e na ficha de karma.

Os novos sons de guarda, bloqueio, aparo e reflexo ficam em `client/assets/sfx/shield-*.mp3`; cada colisão usa uma variação curta, luz central, feixes opostos, faiscamento e abalo local de câmera. A física, o dano, o controle de PK e a recompensa continuam decididos pelo servidor.

As folhas novas vêm com fundo preto opaco. O gerador transforma esse preto em transparência com uma rampa suave antes de montar cada tira WebP. As auras contínuas usam glifos discretos aos pés, wisps nas laterais e luz orbital proporcional ao grau de karma; a arte grande da linhagem aparece por um instante ao derrotar uma presa. Isso mantém o retrato e a insígnia legíveis sem quadrados ou molduras girando sobre o personagem.
