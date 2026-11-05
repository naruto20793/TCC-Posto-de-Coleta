# Matriz de evidências do TCC

| Objetivo ou requisito | Implementação | Evidência reproduzível | Limite da evidência |
| --- | --- | --- | --- |
| Autenticar e impedir acesso indevido | Autenticação e middleware da API | `npm test`, `npm run test:integration` | Não substitui avaliação de segurança institucional. |
| Evitar reservas sobrepostas | Índices de reservas ativas | Teste de duas reservas concorrentes na integração | Requer índices preparados no ambiente publicado. |
| Separar rascunho e publicação | Escopo de leitura e status | Integração e testes de interface de laudos | Publicação não é assinatura digital. |
| Controlar distribuição | MovimentacaoLaudo e estado atual | Teste de sequência, concorrência e nome cifrado em `workflow-extra.integration.test.js` | Registro de entrega depende da conferência realizada pela equipe. |
| Corrigir sem apagar original | Referências retifica/substituidoPor e versão | Teste de rascunho privado, publicação e original preservado | Não realiza interpretação clínica automática. |
| Recuperar acesso | Senha temporária aleatória, expiração e revogação | Testes de API e navegador | A identificação da pessoa é um procedimento administrativo. |
| Adaptar a interface | Bootstrap local e foco/rótulos | Testes em 390 px, formulários e capturas | Não equivale a auditoria completa de acessibilidade. |
| Demonstrar fluxo integrado | `tests/e2e/workflow.spec.js` | `npm run test:e2e` | Banco isolado; a passagem da data da consulta é preparada na fixture. |
| Facilitar tarefas no posto | Interface e pesquisa com participantes | `PROTOCOLO_DE_AVALIACAO.md` | Pendente de coleta real. Não atribuir tempo ou satisfação sem dados. |
| Recuperar dados após falha | Procedimento de operação | `OPERACAO_E_BACKUP.md` | Pendente de exercício documentado de restauração. |

## Resultados locais em 5 de novembro de 2026

- `npm test`: 49 testes aprovados na execução inicial das mudanças.
- `npm run test:ui`: 12 testes aprovados em Chromium 153, com API simulada e estilos Bootstrap locais.
- Integração com MongoDB: bloqueada neste ambiente antes dos testes, com `open: Operation not permitted`. Não registrar essa execução como aprovação das funcionalidades.

## Resultado no GitHub Actions

Versão `4bf90f4ba4fa50ec510ee34065fa911fcd8c0046`, execução [58](https://github.com/naruto20793/TCC-Posto-de-Coleta/actions/runs/42094597171), concluída com sucesso em 5 de novembro de 2026:

- `npm test`: 49 aprovados.
- `npm run test:integration`: 31 aprovados com MongoDB temporário.
- `npm run test:ui`: 12 aprovados com API simulada.
- `npm run test:e2e`: 1 cenário aprovado com navegador, servidor e banco isolado.

Esses resultados não indicam atualização do servidor hospedado, homologação institucional, coleta com participantes ou restauração de backup. A limitação local do MongoDB foi contornada pela execução no ambiente do GitHub Actions.

## Registro de coleta

Para cada verificação, guardar data, SHA, ambiente, comando, resultado e localização da evidência. Capturas em `tests/ui/laudos.spec.js` mostram a interface real com respostas simuladas e dados fictícios; não são capturas de uma unidade em produção.
