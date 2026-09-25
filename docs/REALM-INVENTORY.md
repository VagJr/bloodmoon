# Inventário ilustrado do Reino

Abra **Inventário** no códice, na barra do Reino ou pela tecla **I**.

- Mochila paginada em slots quadrados, com filtros para equipamentos, recursos e cartas. As cartas da coleção são pilhas; relíquias são instâncias individuais com durabilidade própria. Não há novo limite artificial de capacidade.
- Figura humana original com cinco espaços funcionais: cabeça, corpo, mãos, relíquia e talismã. O catálogo atual não contém botas; os pés não apresentam um espaço funcional fictício.
- Inspeção por clique/toque, raridade, vínculo, quantidade, bônus, desgaste, equipar, guardar e reparar. Reparos exibem custo real e exigem mercador/cidade, Marcas e minério.
- Vida, mana, vigor, defesa, poder físico, proficiência e atributos na mesma tela. A distribuição de pontos permanece em Viajante.
- Listas antigas de relíquias e desgaste removidas de Viajante. Os recursos apresentados são os existentes na economia; o inventário não cria uma segunda coleção.

## Regras e compatibilidade

O viajante pode usar uma peça de cabeça, uma de corpo, uma arma nas mãos e duas relíquias. Trocar um tipo ocupado devolve a peça anterior à mochila. A Arena e os postos mantêm suas próprias regras de equipamento.

O formato de combate continua usando IDs de cartas. `equipmentItems` associa cada ID à instância selecionada para que atributos, desgaste e saque usem a mesma cópia. Saves antigos normalizam categorias repetidas uma vez, mantendo todos os itens no inventário.

## Arte

`client/assets/world/codex/inventory-traveler.webp`: figura original criada com imagegen, cavaleiro encapuzado em armadura escura, vista frontal e fundo de alcova gótica. O PNG fonte está na mesma pasta.

`client/assets/world/objects/inventory-{meat,hides,scrap}.png`: três desenhos originais de carne de caça, couros e sucata metálica, extraídos de uma sheet de três células criada com imagegen. Demais slots reutilizam as ilustrações de cartas e recursos existentes.

## Verificação

- Suíte completa: 145 testes passaram.
- Testes específicos: substituição por categoria, retirada sem perda, identidade da cópia, desgaste, saque, vínculo, bloqueios e migração.
- Navegador Edge: equipar/guardar com servidor isolado em memória; filtros, paginação e inspeção. Larguras 320, 390, 768 e 1440 px verificadas, sem imagens ausentes ou erros JavaScript.
- Capturas em `docs/art/realm-inventory-desktop.png`, `realm-inventory-mobile.png` e `realm-inventory-resources.png`.

Os dados reais do jogador não foram usados para os testes de mutação. Esta alteração está no projeto local; não inclui publicação em servidor remoto.
