# Bloodmoon — auditoria e critérios de lançamento 1.0

## Resultado desta revisão

Revisados os seis arquivos modificados pela ferramenta anterior contra a versão registrada e as regras apresentadas ao jogador. A suíte atual passou com 45 testes, incluindo API local isolada, pareamento, persistência local, quinze capítulos e histórias secundárias. Não foi usado o banco de produção.

| Alteração anterior | Decisão e motivo |
|---|---|
| Tributo por 1 Favor e várias ordens da mesma frente | Corrigida: 2 Favores e uma ordem por frente/rodada, conforme o Conselho de Guerra. Estados salvos com chaves por tática também respeitam o limite. |
| Tributar rival que já passou | Bloqueado: gastava recurso sem benefício possível naquela rodada. |
| Reabrir duelos por código | Removido: matchmaking é o fluxo solicitado. A suíte agora pareia jogadores pela fila real. |
| Contar equipamento quebrado como já possuído ao conceder segunda linhagem | Mantido: evita reposição gratuita de durabilidade. |
| Reserva com unidades acima de custo 2 | Mantido: ordenação por custo e limite da curva continuam protegendo o deck. |
| Consultar perfil antes de concluir apresentação | Mantido: necessário para retomar o onboarding. |
| Preservar perfil legado no registro | Mantido. |
| Testar apenas oito capítulos | O teste dos oito originais foi mantido e complementado por cobertura de todos os capítulos publicados. |

Também foi bloqueada a abertura de partidas simultâneas pela mesma conta, incluindo nova checagem após operações assíncronas do matchmaking. O teste da API confirma que uma conta pareada não abre uma caçada paralela.

## Conteúdo integrado

Seis histórias secundárias em Reinos → Crônica: O último barco, Cartas sem selo, O ferro dos esquecidos, Pegadas no degelo, O coro sem voz e A mesa dos adversários. Cada história tem nível mínimo, destino, objetivo após aceitação, dois desfechos narrativos, registro no diário e recompensa única. Até três podem ficar ativas. As escolhas são narrativas; não alteram atributos ou criam novas regiões. Sem prazo, sequências obrigatórias ou perda por ausência.

## Portões de qualidade para chamar a versão de 1.0

| Responsabilidade | Critério verificável | Estado |
|---|---|---|
| Design de combate | Custos e limites iguais no motor, IA e interface | Corrigido nesta revisão; regressões cobertas |
| QA funcional | Autenticação, partida completa, recompensas únicas, versões e privacidade | 45 testes passam; cobertura não equivale a ausência de bugs |
| Narrativa | Todo capítulo publicado pode avançar; escolhas e recompensas persistem | Regras de quinze capítulos e seis histórias cobertas |
| Economia | Sem duplicação; reparo/reserva permitem voltar a jogar | Testes de recuperação existentes passam; emissões exigem simulação extensa |
| Multiplayer | Fila, cancelamento, reconexão e abandono previsíveis | Pareamento coberto; reconexão em perda real de rede e timeout de jogador ainda pendentes |
| Persistência/infra | Falhas de escrita recuperáveis, backup e restauração ensaiados | Pendente em ambiente de homologação Atlas; mapas em memória pressupõem uma instância |
| Segurança | Concorrência em registro/compras, autorização, sessões e limites sob carga | Verificações básicas cobertas; auditoria adversarial e carga pendentes |
| UX/acessibilidade | Caminho completo por teclado, touch, telas pequenas e movimento reduzido | Pendente de sessão visual PC/iOS/Android desta versão |
| Arte/VFX/áudio | Inventário de artes provisórias, consistência e mix verificados em aparelhos | Pendente de revisão audiovisual; não alterado nesta auditoria |
| Performance | Medir frame time, memória e latência no aparelho e hospedagem alvo | Pendente de medições reais; não presumir capacidade de free tier |
| Operação | Logs sem segredos, diagnóstico de falhas e plano de rollback | Requer ensaio de implantação e recuperação |
| Balanceamento | Matriz por facção, arquétipo e experiência; taxas de vitória e duração | Pendente de playtests e telemetria; testes de regras não demonstram equilíbrio |

O projeto não foi renomeado artificialmente para 1.0. “AAA” não é uma propriedade certificável pela suíte de testes ou pela quantidade de conteúdo. O próximo marco de lançamento deve exigir evidência para cada pendência acima.

## Continuação — apresentação e expedições

- Menus de Arsenal, Decks, Equipamentos, Relicário, Contratos, Legado e Academia recebem cenários, emblemas, navegação com estado ativo e molduras em profundidade. Ajuda contextual recolhível; controles existentes preservados. A apresentação usa as artes existentes, sem novas gerações.
- Conselho de Expedição na Crônica: quatro preparações, desbloqueadas nos níveis 1 a 4. Tradicional; 2 Favores iniciais para ambos; 2 Suprimentos para ambos; ou 1 Cerco e +4 vida para ambos. A regra acompanha as mesas da dungeon. Não altera partidas PvP nem multiplica recompensas. Vitórias finais elegíveis registram o domínio de cada preparação.
- A consulta de preparação agora identifica a partida ativa da conta. O cliente recupera o botão de retomada mesmo sem o identificador salvo na aba. Uma conta em combate não aparece como apta a abrir outra partida.
- 48 testes passaram. Novas verificações cobrem simetria das preparações, nível mínimo, trava durante dungeon, registro de vitórias e descoberta de partida ativa.
- Inspeção em navegador com conta descartável, servidor local isolado: login, abertura de Decks e navegação para Equipamentos funcionaram. Na largura de 390 px, a janela de Decks mediu aproximadamente 367 px sem transbordamento horizontal. A navegação duplicada encontrada foi removida; Boosters permanece acessível. Nenhum erro de console foi registrado nesse percurso.
- Esta sessão não valida aparelhos físicos, áudio, todas as janelas nem carga/Atlas. A CLI agent-browser não estava instalada; a inspeção foi feita pelo navegador integrado.
