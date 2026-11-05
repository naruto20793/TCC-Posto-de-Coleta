# Publicação e continuidade do protótipo

## Atualização

1. Guardar cópia de segurança e verificar uma instalação de teste antes de alterar a principal.
2. Instalar dependências com `npm ci`.
3. Preservar as configurações existentes de conexão e criptografia. A troca de CRYPTO_KEY impede a leitura dos valores cifrados com a chave anterior.
4. Na instalação persistente, executar `npm run db:check` e revisar o resultado. Não aplicar migração se a conferência apontar conflitos sem antes investigá-los.
5. Executar `npm run db:indexes`. A nova versão exige os índices de retificações e movimentações para iniciar; o comando adiciona índices sem remover os existentes.
6. Publicar o backend e os arquivos de `public/`, incluindo `public/vendor/bootstrap/`.
7. Verificar `/api/health`, login, troca de senha, agenda, rascunho/publicação, retificação e retirada com contas fictícias.

O Bootstrap 5.3.2 é distribuído com sua licença MIT em `public/vendor/bootstrap/`. A interface não depende do CDN para esses arquivos. As instruções de Node/MongoDB continuam no README.

## Política de acesso a confirmar com a unidade

O paciente lê somente os próprios laudos publicados. O rascunho é privado do médico autor. Conforme a decisão anterior do projeto, os médicos e a administração consultam os publicados. O histórico com nome do recebedor da retirada é administrativo. A retificação é iniciada pelo autor e o original permanece disponível. Rever a necessidade de cada permissão com a unidade antes da adoção institucional; essa revisão não foi substituída por uma alteração silenciosa da regra anterior.

## Recuperação de acesso

A administração encontra a ação Redefinir senha em Administração → Usuários, confirma sua própria senha e recebe uma credencial aleatória exibida na resposta. Ela expira em 24 horas, revoga sessões anteriores e exige troca antes de acessar os atendimentos. Administrador comum redefine pacientes e médicos; superadministrador também redefine administradores comuns. A ação não redefine superadministradores nem a própria conta. O nome do paciente, CPF e senha não são incluídos no identificador da auditoria.

Identidade e autorização para receber a credencial devem ser verificadas pela unidade. O sistema não envia e-mails nem WhatsApp automaticamente. A regra anterior de CPF como senha inicial de novos pacientes/médicos foi preservada.

## Exercício de backup e restauração

Responsável: a definir com o mantenedor. Periodicidade e objetivos de perda máxima de dados e tempo de recuperação: a definir conforme a rotina da unidade, sem assumir garantias que não foram medidas.

Procedimento com MongoDB Database Tools:

1. Preparar `mongodump` e `mongorestore` compatíveis e duas conexões distintas: origem e banco isolado de restauração. Usar as instruções oficiais: https://www.mongodb.com/docs/database-tools/mongodump/ e https://www.mongodb.com/docs/database-tools/mongorestore/.
2. Interromper gravações da instalação de teste durante a obtenção da cópia, para comparar um estado consistente. Não interromper a unidade real sem planejamento próprio.
3. Gerar um arquivo `--archive` com `--gzip`. Guardar o arquivo em local com acesso restrito e proteção adequada. Preservar separadamente a chave de criptografia e as configurações necessárias à restauração.
4. Restaurar com mapeamento de namespace para um banco novo e isolado. Conferir a conexão e o nome de destino antes de executar. Não usar `--drop` no banco original.
5. Conferir contagens de usuários, pacientes, médicos, agendamentos, laudos, movimentações e auditoria; verificar índices e vínculos entre versões.
6. Iniciar uma cópia do sistema contra o banco restaurado, com a mesma chave clínica. Verificar leitura dos laudos, histórico de retirada e login de contas de teste.
7. Registrar horários de início/fim, versão do sistema, período coberto, resultado de cada conferência e falhas. O arquivo de backup sozinho não comprova restauração.

Tabela de evidência:

| Data | Origem de teste | Destino isolado | Início/fim | Contagens conferidas | Leitura clínica | Login | Responsável | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A preencher | | | | | | | | |

Este procedimento está preparado; nenhuma cópia do banco real foi gerada ou restaurada nesta atualização.
