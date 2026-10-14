# Validação — melhorias do banco em 14/10/2026

Base: `51dc298d846852aad159a8ff396a7bc89cc6a75d` da `main`.

## Código

- `npm test`: **19 testes passaram**, incluindo regras/DOM, criptografia autenticada, gravação/leitura/edição com middleware real do Mongoose e transporte simulado, listas clínicas, falha de persistência com nova tentativa e proteção contra atualizações sem criptografia.
- `git diff --check`: passou.
- `npm run test:integration`: não validado neste ambiente. O MongoDB temporário encerra com código 100 e `open: Operation not permitted`; tentativas com MongoDB 8.2.6, 8.0.17 e 7.0.24 não resolveram a restrição. Os testes de integração receberam verificações de valores brutos cifrados, leitura autorizada, migração idempotente e nova tentativa após falha.
- `npm run test:ui`: não validado neste ambiente. Chromium ausente; a instalação falhou por download inválido/truncado. A interface não foi alterada nesta atualização.
- O workflow do GitHub executa regras, integração e navegador. Consulte os resultados do commit antes de hospedar.

## Atlas

Conexão ao `Cluster0`, banco `SuaDatabaseAqui`. Pacientes, agendamentos e laudos estavam vazios durante a verificação: não havia conteúdo clínico legado para recriptografar. Sete índices não únicos foram adicionados para a ordenação das listagens de agenda, laudos e auditoria. Os índices únicos de reserva de médico e paciente e todos os documentos existentes foram preservados.

A aplicação nova exige `CRYPTO_KEY` estável no ambiente. A chave não foi criada nem gravada no GitHub. A integração de criptografia só entra em uso após configurar a chave e executar a versão atualizada do backend. `db:crypto:check` e `db:crypto:migrate` permitem conferir e proteger documentos legados de outras instalações.

O cadastro público de qualquer nível permanece disponível para testes fora de produção, conforme solicitado anteriormente. Em produção permanece fechado.

## Histórico de validação anterior

Base: `8f1e282068e611e331ece6cfa14e34db6c901c48`.
O [workflow anterior](https://github.com/naruto20793/TCC-Posto-de-Coleta/actions/runs/36003836139) passou com **28 testes**: 11 de regras/DOM, 12 com MongoDB temporário e 5 com navegador Chromium.

## Cadastro público de teste

A mudança atual permite criar contas de paciente, médico, administrador e super administrador sem login quando `NODE_ENV` não é `production` e `ALLOW_PUBLIC_TEST_REGISTRATION` não é `false`. Em produção, a rota pública devolve 401 mesmo com a flag `true`. Tokens de usuários já logados continuam sujeitos às permissões anteriores. O formulário mostra apenas os campos necessários a cada perfil, salva no MongoDB e encaminha para o login.

Localmente, `npm test` inclui testes de seleção dos quatro perfis, envio sem token e fechamento da rota em produção. A suíte com replica set temporário recebeu dois testes novos, e a suíte Playwright recebeu um novo fluxo para os quatro perfis. Elas precisam passar no check do PR após a atualização desta branch.

## Banco real na versão anterior

Na versão anterior, nenhuma conexão com dados reais do usuário foi feita. Para ativar em banco existente, primeiro faça backup, confira `npm run db:check` em uma cópia, resolva conflitos, pare gravações antigas e só depois execute `npm run db:migrate` e `npm run db:indexes`. A versão de desenvolvimento permite criar um super administrador sem login e não deve ficar acessível pela internet.
