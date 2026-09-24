# Validação

Base: `8f1e282068e611e331ece6cfa14e34db6c901c48`.
O [workflow anterior](https://github.com/naruto20793/TCC-Posto-de-Coleta/actions/runs/36003836139) passou com **28 testes**: 11 de regras/DOM, 12 com MongoDB temporário e 5 com navegador Chromium.

## Cadastro público de teste

A mudança atual permite criar contas de paciente, médico, administrador e super administrador sem login quando `NODE_ENV` não é `production` e `ALLOW_PUBLIC_TEST_REGISTRATION` não é `false`. Em produção, a rota pública devolve 401 mesmo com a flag `true`. Tokens de usuários já logados continuam sujeitos às permissões anteriores. O formulário mostra apenas os campos necessários a cada perfil, salva no MongoDB e encaminha para o login.

Localmente, `npm test` inclui testes de seleção dos quatro perfis, envio sem token e fechamento da rota em produção. A suíte com replica set temporário recebeu dois testes novos, e a suíte Playwright recebeu um novo fluxo para os quatro perfis. Elas precisam passar no check do PR após a atualização desta branch.

## Banco real

Nenhuma conexão com dados reais do usuário foi feita. Para ativar em banco existente, primeiro faça backup, confira `npm run db:check` em uma cópia, resolva conflitos, pare gravações antigas e só depois execute `npm run db:migrate` e `npm run db:indexes`. A versão de desenvolvimento permite criar um super administrador sem login e não deve ficar acessível pela internet.
