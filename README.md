# Posto de Coleta Araranguá

Sistema em HTML, CSS, Bootstrap 5 e JavaScript, com API Express e MongoDB/Mongoose. Os fluxos de login, cadastro, agenda, consultas, perfis e laudos usam a API. Não há autenticação por senhas salvas no navegador.

## Requisitos

- Node.js 22 ou superior e npm.
- MongoDB Atlas **ou MongoDB local com replica set**. Cadastro e auditoria de operações clínicas usam transações; um servidor standalone não é suficiente.
- Conectividade com o CDN do Bootstrap para os estilos/componentes da interface.

## Instalação em banco novo

```bash
npm ci
```

Copie `backend/.env.example` para `backend/.env` e preencha `MONGODB_URI`, `JWT_SECRET`, `CRYPTO_KEY`, `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD`. A senha inicial deve ter pelo menos 12 caracteres. Nunca envie `.env` ao GitHub.

Gere duas chaves independentes, uma para JWT_SECRET e outra para CRYPTO_KEY (execute duas vezes):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Prepare o banco e crie a primeira conta:

```bash
npm run db:indexes
npm run seed
npm start
```

Acesse **http://localhost:5000/**. Entre com o email e a senha configurados. O sistema identifica o perfil pela conta. Depois do seed, remova `DEFAULT_ADMIN_PASSWORD` do ambiente. Não existe senha administrativa padrão.

## Cadastro público temporário para testes

Com `NODE_ENV=development`, visitantes podem entrar em **http://localhost:5000/login/login.html**, escolher **Criar conta para teste** e selecionar paciente, médico, administrador ou super administrador. O usuário e o perfil ficam no MongoDB, e depois do cadastro é possível entrar com email e senha. Para testar o login de médico, a especialidade é opcional. A tela administrativa permite cadastrar especialidades e serviços.

Essa opção fica ativa por padrão somente em desenvolvimento. Para desligar também nesse ambiente, configure `ALLOW_PUBLIC_TEST_REGISTRATION=false` em `backend/.env` e reinicie o servidor. Com `NODE_ENV=production`, o cadastro público fica **sempre desativado**, mesmo se a variável estiver como `true`. Não use a versão de desenvolvimento exposta à internet: qualquer visitante poderá criar uma conta de super administrador.

Na administração:

1. Cadastre especialidades e serviços.
2. Cadastre um médico com CRM, CPF, nascimento, telefone e especialidade.
3. Cadastre um paciente e sua credencial inicial.
4. Entre como paciente e agende um horário.
5. Entre como médico, confirme a consulta e marque como realizada após o horário.
6. Crie o laudo, confira o rascunho e finalize para liberar ao paciente.

O expediente inicial dos médicos é de segunda a sexta, das 08h às 17h. O cadastro via API também aceita `horarioDisponivel`. A agenda desta versão utiliza atendimentos de **30 minutos**, horário de Brasília/Araranguá (UTC−03:00) e antecedência máxima de 90 dias. O catálogo apresenta serviços gratuitos pelo SUS e orientações de preparo, sem preços ou cobrança ao paciente. O campo legado `valor` não é mais aceito nem retornado pela API; os registros históricos no banco são preservados.

## Banco existente: migração controlada

Não execute migração diretamente sobre a única cópia do banco. Faça backup e valide primeiro em uma cópia. Pare as gravações da versão antiga durante a migração.

```bash
npm run db:check
```

Esse comando apenas confere os registros. Ele identifica conflitos de vínculo, hashes de senha ausentes/inválidos, referências clínicas ausentes e sobreposições de horários. Os relatórios identificam registros pelo ID; não imprimem senhas ou a URI do banco.

Depois de resolver os conflitos:

```bash
npm run db:migrate
npm run db:indexes
npm start
```

A migração vincula perfis legados a `Usuario`, preserva hashes bcrypt existentes e preenche as reservas de horários. Contas administrativas legadas entram como `admin`, sem promoção automática. Os registros originais e seus hashes são preservados; não há exclusão de pacientes, consultas ou laudos. Execute os comandos com acesso de manutenção e a aplicação parada.

`db:indexes` adiciona índices sem apagar índices existentes. A inicialização verifica os índices essenciais e a preparação dos agendamentos, recusando iniciar com reservas antigas não migradas.

Os dados antigos do `localStorage` **não são importados automaticamente** e permanecem no navegador. Se houver dados reais ali, exporte-os e revise-os antes de qualquer importação. Os IDs locais e os formatos antigos não correspondem diretamente aos documentos MongoDB.

### Criptografia dos campos clínicos

Configure `CRYPTO_KEY` com pelo menos 32 caracteres em `backend/.env` antes de iniciar. Preserve essa chave em armazenamento seguro: perder ou trocar a chave impede a leitura dos dados. A chave nunca fica no repositório. Se você utilizava `DadosSensiveis`, mantenha a chave histórica.

Os modelos protegem título, descrição, resultados, conclusão e recomendações de laudos; notas e observações de agendamentos; e as listas do histórico médico do paciente. O banco recebe texto criptografado com AES-256-GCM e IV aleatório. A API mantém os formatos existentes e as mesmas permissões. Isso não criptografa CPF, telefone, endereço ou anexos.

Para registros antigos, pare as gravações e execute:

```bash
npm run db:crypto:check
npm run db:crypto:migrate
```

A conferência não grava nada. A migração verifica tipos e leitura dos valores já criptografados antes de alterar registros; compara o valor original para não sobrescrever edições concorrentes. É retomável e idempotente, preserva IDs, timestamps e histórico e não imprime conteúdo clínico. Se interrompida, pode haver registros já migrados: execute novamente com a mesma chave. Backups anteriores continuam contendo os textos antigos.

Ao programar novas gravações clínicas, use `create()` ou documentos hidratados com `save()`, para validar em texto claro e criptografar depois. Atualizações diretas nesses campos, substituição de documentos e `insertMany()` são recusados. `lean()`, operações nativas da coleção e `bulkWrite()` não devem ser usados para ler/gravar dados clínicos; a migração usa a coleção nativa deliberadamente, com proteção explícita.

## Segurança e permissões

| Perfil      | Acesso                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Paciente    | Próprio cadastro, próprios agendamentos e laudos finalizados/assinados                          |
| Médico      | Próprias consultas; pacientes vinculados aos atendimentos; criação e finalização de seus laudos |
| Admin       | Cadastro de pacientes/médicos, catálogo, agenda, consulta administrativa e auditoria            |
| Super admin | Acesso administrativo e ativação/desativação de contas; criação de administradores pela API     |

- Credenciais centralizadas em `Usuario`, hash bcrypt, JWT HS256 e validação do estado atual da conta a cada requisição.
- Tokens em `sessionStorage`, nunca senhas; troca de senha e mudança de status invalidam tokens antigos. Proteção contra XSS continua necessária.
- Bloqueio temporário após cinco tentativas incorretas e limite adicional por IP. Para múltiplas instâncias, substitua o limite em memória por armazenamento compartilhado.
- Paciente e médico não escolhem outra identidade ao consultar ou escrever registros.
- Listagens paginadas na API (`page`, `limit`, máximo 100); a interface percorre páginas para as listas do protótipo, limitada a 10 mil registros.
- Índices únicos de reserva por médico e paciente impedem sobreposição mesmo em requisições concorrentes.
- Cancelamento preserva histórico; laudos finalizados não podem ser editados ou excluídos.
- Respostas da API com `Cache-Control: no-store`; o cache antigo é removido na atualização. O app não registra novo service worker.
- Validações de campos, IDs, data/hora, tamanho de senha e lista explícita de campos editáveis. CPF é normalizado e validado em formato (11 dígitos); não valida existência ou titularidade.
- Auditoria de cadastro e operações clínicas na mesma transação. A auditoria registra ação/recurso, sem conteúdo clínico ou senhas.

Use HTTPS e configure `NODE_ENV=production`, `FRONTEND_URL` e uma chave JWT longa ao hospedar. Se usar proxy reverso, configure explicitamente a confiança no proxy antes de depender do limite por IP. CSP ainda precisa ser ajustada aos recursos externos/à página legada de localização. Recuperação automática de senha, assinatura digital de laudos, anexos e envio de lembretes não estão implementados.

## Hospedagem

### Netlify

`netlify.toml` publica `public/`, e `netlify/functions/api.mjs` encaminha `/api/*` para a mesma aplicação Express. A conexão MongoDB e a verificação de índices são reutilizadas entre invocações da função. O cadastro público de teste fica sempre desativado nessa hospedagem.

Configure `MONGODB_URI`, `JWT_SECRET` e `CRYPTO_KEY` como segredos no Netlify, no contexto de produção e com escopo **Functions**. Configure também `NODE_ENV=production` e `FRONTEND_URL` com a URL HTTPS do site. Preserve `CRYPTO_KEY` nos futuros deploys. Não coloque essas credenciais no repositório. O usuário do banco precisa de `readWrite` no banco da aplicação e o Atlas deve permitir a conexão da hospedagem.

Prepare os índices antes da publicação, conforme as instruções anteriores. O deploy não executa seed nem migrações automaticamente. Depois de publicar, confira `/api/health` e teste login, sessão e uma tela administrativa. A função limita o pool a cinco conexões por instância; acompanhe conexões e erros no Atlas antes de aumentar esse limite.

As páginas chamam `/api` na mesma origem. Para usar os fluxos completos, execute `npm start` em um ambiente que mantenha o processo Node.js ativo e tenha acesso ao MongoDB. Publicar apenas a pasta `public/` não disponibiliza a API.

Em outra hospedagem estática, será necessário configurar um proxy `/api` para o backend hospedado separadamente. O preview estático automático do repositório não é uma validação do backend.

## Organização

- `backend/app.js`: app testável sem iniciar servidor.
- `backend/server.js`: conexão, verificação do banco, inicialização e encerramento.
- `backend/models/`: documentos e índices.
- `backend/routes/`: endpoints e autorização.
- `backend/services/`: contas, agenda, transações e auditoria.
- `backend/scripts/database-maintenance.js`: conferência, migração e índices (inclui administradores).
- `backend/scripts/encrypt-clinical.js`: conferência e migração idempotente da criptografia clínica.
- `public/assets/api.js`: cliente HTTP e sessão.
- `public/`: páginas e scripts separados por funcionalidade, Bootstrap responsivo.
- `tests/`: testes de regras e integração.

## Testes

```bash
npm test
npm run test:integration
npx playwright install chromium
npm run test:ui
```

O teste padrão inclui regras e DOM simulado. Playwright verifica a interface com API simulada, incluindo viewport móvel. Consulte `docs/VALIDACAO.md` e os checks do PR para as verificações efetivamente concluídas.

A integração inicia um replica set **temporário isolado**, sem usar `MONGODB_URI` do ambiente. Precisa poder baixar e executar o binário MongoDB. Verifica persistência, rollback de cadastro, autorização, bloqueio temporário, concorrência de reservas, cancelamento, liberação de laudos, migração e revogação de sessão. A primeira execução pode demorar pelo download.

O modo `USE_MEMORY_DB=true`, com `MONGODB_URI` ausente e fora de produção, serve apenas para desenvolvimento temporário. Dados desaparecem ao encerrar. Seed e migração exigem URI persistente para impedir preparação acidental de bancos temporários independentes.

## API principal

| Endpoint                                                          | Uso                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `POST /api/auth/login`                                            | Autenticar por email/senha                                      |
| `GET /api/auth/me`                                                | Validar sessão                                                  |
| `GET /api/auth/registration`                                      | Verifica se o cadastro público de teste está ativo              |
| `POST /api/auth/register`                                         | Cadastro público em desenvolvimento; administrativo em produção |
| `PATCH /api/auth/senha`                                           | Trocar senha com senha atual                                    |
| `PATCH /api/auth/usuarios/:id/status`                             | Ativar/desativar conta (super admin)                            |
| `GET /api/pacientes`, `GET /api/medicos`                          | Listas conforme permissão                                       |
| `PUT /api/pacientes/:id`, `PUT /api/medicos/:id`                  | Editar nome, telefone e endereço                                |
| `GET /api/agendamentos/disponibilidade?medico=ID&data=AAAA-MM-DD` | Horários sem dados de terceiros                                 |
| `POST /api/agendamentos`                                          | Reservar 30 minutos                                             |
| `PUT /api/agendamentos/:id`                                       | Transição de status                                             |
| `DELETE /api/agendamentos/:id`                                    | Cancelar, preservando registro                                  |
| `POST /api/laudos`                                                | Criar rascunho para consulta realizada pelo médico              |
| `PUT /api/laudos/:id`                                             | Editar rascunho ou finalizar                                    |
| `GET /api/auditoria`                                              | Últimas 200 operações (admin)                                   |
| `GET /api/health`                                                 | Estado real da conexão MongoDB                                  |

### Atendimento pelo SUS

O catálogo e o agendamento não oferecem pagamentos, preços ou convênios particulares. Serviços podem receber `orientacoes` de preparo e uma `especialidade`; ao selecionar um serviço, a agenda filtra os profissionais compatíveis e a API valida essa relação. As consultas exibem o serviço e a especialidade registrados. O cadastro de teste continua restrito às condições de desenvolvimento existentes.

Esta adaptação não integra SISREG, e-SUS ou RNDS e não implementa regulação municipal ou fila clínica. O agendamento direto existente permanece disponível; sua utilização real depende de validar o fluxo com a unidade responsável. As orientações de preparo devem ser cadastradas pela equipe, sem instruções clínicas automáticas.

### Indicadores públicos de exames e satisfação

A equipe informa a quantidade de exames ao marcar um atendimento como realizado (0 para consulta sem exame). Registros anteriores sem essa quantidade não são convertidos em exames. O gráfico soma as quantidades por mês da data do atendimento, nos seis meses até o mês atual de Brasília. O campo `data` do agendamento é uma data civil armazenada em UTC, por isso o agrupamento usa UTC.

Pacientes autenticados podem avaliar seu próprio atendimento concluído uma única vez, de 1 a 5, na página Consultas. A satisfação pública é a proporção de notas 4 ou 5 entre as respostas recebidas, com tamanho da amostra visível. Ausência de avaliações aparece como “Ainda sem avaliações”, não como 0% ou satisfação presumida. A nota individual não é retornada nas consultas; a rota pública retorna somente agregados.

### Comentários nas avaliações

Em Consultas, o paciente pode avaliar separadamente a consulta e o médico do próprio atendimento realizado, com nota de 1 a 5 e comentário opcional de até 1000 caracteres. Uma avaliação de cada tipo por atendimento; notas antigas de consulta são mantidas e podem receber um primeiro comentário. Comentários ficam disponíveis apenas no acesso autorizado ao atendimento (paciente, médico responsável e administração), sem publicação no painel público.

A lista ampliável em `backend/services/moderation.js` substitui termos impróprios por asteriscos no servidor antes da gravação, considerando caixa, acentos, repetições e algumas formas de disfarçar palavras. Críticas legítimas são preservadas. O filtro é baseado em termos, não compreende todo contexto nem garante detectar todas as ofensas. Comentários são criptografados em repouso e escapados na interface para impedir execução de HTML.

### Preenchimento pelo CPF

O cadastro administrativo de pacientes consulta por CPF em `POST /api/pacientes/consultar-cpf`, com acesso apenas para administradores e superadministradores. O documento segue no corpo, não na URL; consultas encontradas geram auditoria sem incluir o CPF no identificador do recurso. A resposta contém somente dados cadastrais (nome, CPF, e-mail, telefone, nascimento, gênero, endereço e situação), sem senha, contatos ou histórico médico.

Ao encontrar um paciente, o formulário preenche os campos e passa a atualizar nome, telefone e endereço do cadastro existente, preservando a conta, a senha e os demais dados. CPF não encontrado permite cadastro manual. A busca ocorre ao sair do CPF completo ou clicar em Buscar CPF; respostas antigas são descartadas ao trocar o documento. Esta funcionalidade consulta apenas os pacientes do sistema: não existe integração com Receita Federal ou CadSUS nem obtenção de dados externos pelo CPF.

### Senha inicial de pacientes e médicos

Novos pacientes e médicos recebem o CPF, somente com os 11 números, como senha inicial. A API define a senha, ignora senhas fornecidas no cadastro desses perfis e a armazena com bcrypt. Cadastros administrativos continuam recebendo senha informada pelo administrador; contas já existentes não são redefinidas.

Ao entrar, a conta nova é direcionada à troca de senha. Enquanto `trocarSenha` estiver ativo, a API permite apenas consultar a própria sessão e alterar a senha; as rotas protegidas de atendimento permanecem bloqueadas, mesmo acessadas diretamente. A nova senha deve ter de 8 a 72 bytes, diferir da atual e do CPF. A troca invalida os tokens anteriores e exige novo login. Alterações posteriores ficam disponíveis em Meu perfil.
