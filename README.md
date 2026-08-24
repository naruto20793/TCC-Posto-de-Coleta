# Posto de Coleta Araranguá

Sistema de gestão para pacientes, agendamentos, especialidades, laudos e acesso da equipe.

## Estrutura principal

```text
TCC-Posto-de-Coleta/
├── backend/          API, autenticação e conexão com MongoDB
├── public/           Frontend estático do sistema
├── .gitignore        Arquivos sensíveis e temporários ignorados
├── package.json      Comandos do projeto raiz
├── README.md         Documentação mínima do projeto
└── .env.example      Exemplo de variáveis de ambiente (opcional)
```

## Requisitos

- Node.js 18+
- MongoDB local ou Atlas
- npm

## Início rápido

1. Instale as dependências:

```bash
cd backend
npm install
```

2. Crie o arquivo `.env` dentro de `backend/` com:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/posto-coleta
JWT_SECRET=sua_chave_muito_segura
FRONTEND_URL=http://localhost:5000
```

3. Inicie o backend:

```bash
npm run dev
```

O sistema fica disponível em:

- API: http://localhost:5000
- Frontend: http://localhost:5000/index.html

## Funcionalidades

- Cadastro e autenticação de pacientes, médicos e administradores
- Gestão de agendamentos
- Controle de especialidades e serviços
- Emissão e consulta de laudos
- Painel administrativo com auditoria

## Segurança

- Variáveis sensíveis em `.env` e ignoradas no git
- Helmet habilitado no backend
- CORS restrito à origem configurada
- JWT com secret configurável por ambiente
- Exclusão de arquivos redundantes e documentação não essencial

## Observações

- A aplicação usa MongoDB em memória automaticamente quando `MONGODB_URI` não é definido em desenvolvimento.
- Em produção, a variável `MONGODB_URI` deve sempre existir.
- O projeto foi organizado para manter apenas o essencial para operação e manutenção.
