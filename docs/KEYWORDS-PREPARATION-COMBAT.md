# Selos, preparação e apresentação de combate

- Vocabulário central em `shared/codex.js`, conferido contra as mecânicas da engine. Selos SVG nas cartas, sem texto sobre a ilustração; definições fora da carta na prévia e inspeção. Códice pesquisável e acessos contextuais para economia e preparação.
- Preparação visual: seis posições de relíquias/reservas, escolha manual por posição e proposta determinística usando inventário existente. A aplicação valida novamente a lista e a proposta no servidor, sem comprar ou reparar. Lista ativa e linhagem são atualizadas juntas.
- Preparação distingue quantidade de cartas, legalidade e partida em andamento. Iniciar uma caçada com mesa ativa retoma essa mesa. Reservas válidas não exigem equipamento para jogar.
- Ficha RPG por mouse ou toque no indicador de nível/controle da arena: atributos públicos atuais, XP de batalha, evolução de criaturas e equipamentos efetivamente equipados. XP de batalha não é XP da conta.
- Líder com vida zerada: sequência assíncrona de fragmentação do próprio retrato, ondas de choque, partículas e som sintetizado em camadas. Resultado aguarda a sequência. Movimento reduzido usa dissolução; mute é respeitado. Concessão e vitória por renome não simulam morte por HP.
- Espólios exibem recompensas efetivas retornadas pelo servidor, cartas de itens recebidos quando disponíveis, estado de desgaste e acessos à próxima preparação.

Validação local: 54 testes passaram; sintaxe dos módulos alterados conferida. Navegador em ambiente isolado: códice, inspeção mobile, oficina, ficha RPG e resultado. Na prévia do golpe final foi confirmado que os 17 elementos de retrato estavam ativos e visíveis sem modal de resultado; após a sequência, apareceu o resultado. Nenhum erro no console da prévia. Arquivos temporários removidos. Não foi uma validação de carga ou em aparelhos físicos, nem publicação no Render.
