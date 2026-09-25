# Auras do token e códice de Véspera

A aura usa o zoom real do mapa, separado da ampliação de 1,6× dos golpes. A geometria acompanha o retrato de 60×78 dentro do token de 92×112. O recorte exclui o retrato do canvas; a borda e a base recebem energia, sem uma segunda silhueta desenhada sobre o rosto. O movimento vertical antigo do container foi removido para manter a âncora estável.

## Estados

- Patente: presença discreta, com cor de renome e arte da linhagem.
- Combo: quatro intensidades, com camadas ascendentes e partículas; termina em `comboEndsAt`.
- Chefe: coroa lunar dourada e onda na base durante 6,5 segundos.
- Subida de nível: celebração dourada por 3,6 segundos, somente ao observar aumento de nível durante a sessão.
- Cura e buffs: pulso verde por 2,2 segundos após eventos próprios de cura/buff; canalização de cura também usa verde.
- Barreira: luz prateada enquanto existir a entidade de defesa.
- Movimento reduzido: composição estática, sem subida ou rotação contínua.

As folhas contêm ilustrações independentes, não frames consecutivos. As animações usam escala, opacidade, fase e deslocamento da mesma ilustração. `scripts/build-token-auras.py` extrai, remove preto, suaviza bordas e prepara seis células. As origens ficam registradas em `client/assets/world/vfx/frames/token-auras.json`. Os arquivos originais são preservados.

## Códice

As dez páginas usam arte de abertura, navegação lateral no desktop e rolagem horizontal no celular. Reino oferece cartões de acesso aos sistemas. Maestrias, talentos, ofícios e crônicas recebem ilustrações dos assets existentes. Explicações extensas ficam em detalhes expansíveis; custos, requisitos e ações continuam nos cartões. Expansão e foco são preservados durante a atualização do painel.

## Arte original

Ferramenta: geração integrada de imagens (`image_gen`), sem CLI.

Arquivo original: `client/assets/world/codex/kingdom-codex.png`.
Versão entregue ao navegador: `client/assets/world/codex/kingdom-codex.webp`.

Prompt usado:

> Use case: stylized-concept. Create one original panoramic dark fantasy game menu illustration for Bloodmoon, a gothic world of vampire courts and werewolf packs. Asset is a polished painterly backdrop, no text, no UI, no borders. Scene: an open ancient illuminated grimoire on a dark stone lectern in the foreground, delicate gold brass astrolabe and crimson gem, beyond it a moonlit gothic kingdom, forest and distant castle under a crescent moon. Composition: wide cinematic landscape, large dark uncluttered left third for interface labels; detailed focal book and astrolabe on the right half. Rich charcoal teal shadows, antique gold details, restrained crimson glow, silver moonlight. Hand painted premium fantasy RPG art, atmospheric depth, carefully rendered materials, elegant not noisy. Save the image as a project asset if supported.

## Verificação

Prévia isolada e somente de leitura, criada com um perfil de demonstração existente. Dez páginas verificadas em Edge via Playwright; desktop 1440×1000 e celular 390×844, sem erros de JavaScript ou imagens ausentes. Galeria de comparação usa os componentes reais de token e canvas. Testes cobrem separação de escalas, expiração de combos/cura/chefes e transição de nível. Nenhuma regra de progressão ou combate foi alterada por esta produção visual.
