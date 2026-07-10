# TCC-Posto-de-Coleta

## 🎯 Visão Geral

Sistema web para gerenciamento de agendamentos, pacientes, médicos e laudos em um posto de coleta de amostras.

## 📊 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js + Express.js
- **Banco de Dados**: MongoDB + Mongoose
- **Segurança**: JWT, bcrypt, Helmet, CORS

## 🚀 Quick Start

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar MongoDB

Consulte o guia completo em [MONGODB_SETUP.md](./MONGODB_SETUP.md)

**Resumo rápido:**
```bash
# Criar arquivo .env
cp .env.example .env

# Iniciar MongoDB (se local)
sudo systemctl start mongod

# Iniciar servidor
npm run dev
```

### 3️⃣ Acessar

- **API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📚 Documentação

- [🔧 Guia Completo MongoDB](./MONGODB_SETUP.md) - Instalação, configuração e troubleshooting
- [📂 Estrutura de Pastas](#estrutura)
- [🔗 Endpoints da API](#endpoints)
- [📋 Modelos de Dados](#modelos)

## <a name="estrutura"></a>📂 Estrutura do Projeto

```
TCC-Posto-de-Coleta/
├── models/                  # Schemas Mongoose (Paciente, Médico, Agendamento, etc)
├── routes/                  # Rotas da API REST
├── controllers/             # Lógica de negócio (futuro)
├── config/
│   └── database.js         # Configuração MongoDB
├── assets/
│   ├── database.js         # Sistema legado localStorage
│   └── navbar.js
├── cadastro/               # Páginas de cadastro
├── login/                  # Página de login
├── perfil/                 # Perfis (admin, médico, paciente)
├── agendamento/            # Sistema de agendamentos
├── consultas/              # Página de consultas
├── laudo/                  # Geração de laudos
├── server.js               # Servidor Express
├── package.json            # Dependências npm
├── .env                    # Variáveis de ambiente
├── .env.example            # Template .env
├── .gitignore
├── MONGODB_SETUP.md        # Documentação MongoDB
└── README.md
```

## <a name="endpoints"></a>🔗 Endpoints da API

### Pacientes
```
GET    /api/pacientes          # Listar todos
GET    /api/pacientes/:id      # Obter por ID
POST   /api/pacientes          # Criar novo
PUT    /api/pacientes/:id      # Atualizar
DELETE /api/pacientes/:id      # Deletar
```

### Médicos
```
GET    /api/medicos            # Listar todos
GET    /api/medicos/:id        # Obter por ID
POST   /api/medicos            # Criar novo
PUT    /api/medicos/:id        # Atualizar
DELETE /api/medicos/:id        # Deletar
```

### Agendamentos
```
GET    /api/agendamentos       # Listar todos
GET    /api/agendamentos/:id   # Obter por ID
POST   /api/agendamentos       # Criar novo
PUT    /api/agendamentos/:id   # Atualizar
DELETE /api/agendamentos/:id   # Cancelar
```

### Especialidades
```
GET    /api/especialidades     # Listar todas
POST   /api/especialidades     # Criar nova
PUT    /api/especialidades/:id # Atualizar
DELETE /api/especialidades/:id # Deletar
```

### Serviços
```
GET    /api/servicos           # Listar todos
POST   /api/servicos           # Criar novo
PUT    /api/servicos/:id       # Atualizar
DELETE /api/servicos/:id       # Deletar
```

### Laudos
```
GET    /api/laudos             # Listar todos
POST   /api/laudos             # Criar novo
PUT    /api/laudos/:id         # Atualizar
DELETE /api/laudos/:id         # Deletar
```

### Sistema
```
GET    /api/health             # Status do servidor
```

## <a name="modelos"></a>📋 Modelos de Dados

### Paciente
- Nome, CPF, Email, Telefone
- Data de nascimento, Gênero
- Endereço completo
- Histórico médico (alergias, doenças, medicamentos)
- Contatos de emergência

### Médico
- Nome, CRM, CPF
- Especialidades
- Email, Telefone
- Horários disponíveis
- Endereço

### Agendamento
- Paciente (referência)
- Médico (referência)
- Serviço (referência)
- Data, Hora, Duração
- Status (agendado, confirmado, realizado, cancelado, falta)
- Notas e observações

### Laudo
- Paciente (referência)
- Médico (referência)
- Agendamento (referência)
- Título, Descrição, Resultados
- Conclusões e Recomendações
- Status (rascunho, finalizado, assinado)

### Especialidade
- Nome, Descrição
- Status (ativo/inativo)

### Serviço
- Nome, Descrição
- Especialidade (referência)
- Valor, Duração
- Status (ativo/inativo)

## 🔐 Segurança

- ✅ Senhas com hash bcrypt
- ✅ Validação de entrada
- ✅ CORS configurado
- ✅ Helmet para headers HTTP seguros
- ✅ JWT para autenticação (em desenvolvimento)

## 📝 Variáveis de Ambiente

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/posto-coleta
MONGODB_USER=admin
MONGODB_PASSWORD=senha_segura

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

Veja a seção de troubleshooting em [MONGODB_SETUP.md](./MONGODB_SETUP.md)

## 📝 Scripts Disponíveis

```bash
npm install         # Instalar dependências
npm start          # Iniciar servidor (produção)
npm run dev        # Iniciar servidor (desenvolvimento com nodemon)
```

## 🤝 Contribuição

Este é um projeto de TCC (Trabalho de Conclusão de Curso).

## 📄 Licença

ISC

---

**Status**: Em desenvolvimento 🚧
**Última atualização**: 2024