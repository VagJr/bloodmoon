# Biblioteca sonora integrada

Classificação feita pelos nomes dos MP3 fornecidos na raiz, sem alegação de audição humana. Os arquivos originais foram preservados. `imported-sfx.json` registra origem, cópia, tamanho e hash de cada efeito; o importador ignora uma cópia idêntica de garra.

| Ação | Gravações |
| --- | --- |
| Interface / seleção | Click Buttons, com volume discreto |
| Ataque de lâmina | Sword Slashing 1/2 e Metallic Impact |
| Ataque de lobisomem | Scorpion Claw 1/2/4; vozes Growl, Monster Attack e Bear Roar |
| Ataque de vampiro | Cortes de espada e três variações de Vampire Hiss |
| Dano | Blade Slicing Flesh; impactos fortes também usam Monster Attack |
| Bloqueio | Shielding |
| Drenagem | Três Vampire Hiss com timbre mais grave |
| Magia, cura, sinergia e nível | Magic Spell em durações/timbres próprios |
| Invocação / Corte / Cripta | Teleport |
| Suprema | Vampire Shriek; Werewolf Howl para lobisomens |
| Morte | Fighter Grunt / Monster Attack |
| Explosão final do avatar | Metallic Impact no instante da ruptura, mantendo as camadas graves anteriores |
| Equipar | Sword Unsheath |
| Forja / reparo / quebra | Metallic Impact / Shielding |
| Ouro, saque e vitória | Material Gold / Magic Spell |

As quatro músicas continuam nos ambientes anteriores. Efeitos usam Web Audio, o desbloqueio existente por gesto e o volume mestre do jogo. Limite de 12 gravações simultâneas, até duas de interface; vozes de criatura têm intervalo mínimo. Variações disponíveis evitam repetição imediata. Silêncio inicial/final é detectado na decodificação; pico é ajustado com amplificação limitada, sem alterar os MP3. Excertos recebem saída suave.

Pré-carregamento limitado a três trabalhadores após interação; buffers reutilizados. Áudio que termina de carregar não é reproduzido atrasado: durante carregamento ou falha, mantém-se o som procedural como alternativa. Silenciar interrompe gravações e abaixa o mestre. As gravações substituem os sinais procedurais quando prontas, exceto a explosão final, que combina gravação e camadas graves.

Validação automatizada cobre integridade dos 24 arquivos, destinos, pré-carregamento único, alternância de takes, limite de vozes e silêncio. A validação não substitui uma sessão de mixagem auditiva em aparelhos físicos.

START GAME utiliza start_button_sfx.mp3; a invocação utiliza card_invocation.mp3.
