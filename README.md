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

Copie `backend/.env.example` para `backend/.env` e preencha `MONGODB_URI`, `JWT_SECRET`, `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD`. A senha inicial deve ter pelo menos 12 caracteres. Nunca envie `.env` ao GitHub.

Gere uma chave JWT:

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

Na administração:

1. Cadastre especialidades e serviços.
2. Cadastre um médico com CRM, CPF, nascimento, telefone e especialidade.
3. Cadastre um paciente e sua credencial inicial.
4. Entre como paciente e agende um horário.
5. Entre como médico, confirme a consulta e marque como realizada após o horário.
6. Crie o laudo, confira o rascunho e finalize para liberar ao paciente.

O expediente inicial dos médicos é de segunda a sexta, das 08h às 17h. O cadastro via API também aceita `horarioDisponivel`. A agenda desta versão utiliza atendimentos de **30 minutos**, horário de Brasília/Araranguá (UTC−03:00) e antecedência máxima de 90 dias. O catálogo de serviços é informativo: seus preços não representam cobrança nem confirmação de pagamento.

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

Se você utilizava `DadosSensiveis`, preserve e configure a chave histórica em `CRYPTO_KEY` antes de ler documentos já criptografados. Alterar a chave não recriptografa registros existentes. Os modelos clínicos atuais não aplicam automaticamente essa criptografia a todos os campos.

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

## Organização

- `backend/app.js`: app testável sem iniciar servidor.
- `backend/server.js`: conexão, verificação do banco, inicialização e encerramento.
- `backend/models/`: documentos e índices.
- `backend/routes/`: endpoints e autorização.
- `backend/services/`: contas, agenda, transações e auditoria.
- `backend/scripts/database-maintenance.js`: conferência, migração e índices.
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

| Endpoint                                                          | Uso                                                |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `POST /api/auth/login`                                            | Autenticar por email/senha                         |
| `GET /api/auth/me`                                                | Validar sessão                                     |
| `POST /api/auth/register`                                         | Cadastro administrativo de conta e perfil          |
| `PATCH /api/auth/senha`                                           | Trocar senha com senha atual                       |
| `PATCH /api/auth/usuarios/:id/status`                             | Ativar/desativar conta (super admin)               |
| `GET /api/pacientes`, `GET /api/medicos`                          | Listas conforme permissão                          |
| `PUT /api/pacientes/:id`, `PUT /api/medicos/:id`                  | Editar nome, telefone e endereço                   |
| `GET /api/agendamentos/disponibilidade?medico=ID&data=AAAA-MM-DD` | Horários sem dados de terceiros                    |
| `POST /api/agendamentos`                                          | Reservar 30 minutos                                |
| `PUT /api/agendamentos/:id`                                       | Transição de status                                |
| `DELETE /api/agendamentos/:id`                                    | Cancelar, preservando registro                     |
| `POST /api/laudos`                                                | Criar rascunho para consulta realizada pelo médico |
| `PUT /api/laudos/:id`                                             | Editar rascunho ou finalizar                       |
| `GET /api/auditoria`                                              | Últimas 200 operações (admin)                      |
| `GET /api/health`                                                 | Estado real da conexão MongoDB                     |
