# ✅ Sistema Preparado para MongoDB

## 📦 O Que Foi Criado

### 1️⃣ **Configuração Node.js**
- ✅ `package.json` - Dependências do projeto
- ✅ `server.js` - Servidor Express principal
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `.env` - Configuração local (não commitar)
- ✅ `.gitignore` - Arquivos ignorados do Git

### 2️⃣ **Banco de Dados MongoDB**
- ✅ `config/database.js` - Conexão Mongoose
- ✅ 6 Schemas/Models:
  - `models/Paciente.js`
  - `models/Medico.js`
  - `models/Administrador.js`
  - `models/Agendamento.js`
  - `models/Especialidade.js`
  - `models/Servico.js`
  - `models/Laudo.js`

### 3️⃣ **API REST Completa**
- ✅ 7 Rotas com CRUD (Create, Read, Update, Delete):
  - `routes/pacientes.js`
  - `routes/medicos.js`
  - `routes/administradores.js`
  - `routes/agendamentos.js`
  - `routes/especialidades.js`
  - `routes/servicos.js`
  - `routes/laudos.js`

### 4️⃣ **Documentação**
- ✅ `README.md` - Documentação principal
- ✅ `MONGODB_SETUP.md` - Guia completo de configuração
- ✅ `API_EXAMPLES.md` - Exemplos de requisições
- ✅ `MIGRATION_GUIDE.md` - Guia de migração localStorage → MongoDB
- ✅ `SETUP_CHECKLIST.md` - Este arquivo

---

## 🚀 Próximos Passos

### 1. Instalar Dependências
```bash
cd /home/aluno/Documentos/TCC-Posto-de-Coleta
npm install
```

### 2. Instalar e Configurar MongoDB

#### Opção A: MongoDB Local (Ubuntu/Debian)
```bash
# Instalar MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar status
sudo systemctl status mongod
```

#### Opção B: MongoDB Local (macOS)
```bash
# Instalar com Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Verificar status
brew services list
```

#### Opção C: MongoDB Atlas (Cloud - Recomendado)
1. Acesse https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita
3. Crie um cluster
4. Gere uma connection string
5. Copie a string para `.env` em `MONGODB_URI`

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

**Valores essenciais:**
```env
MONGODB_URI=mongodb://localhost:27017/posto-coleta
PORT=5000
NODE_ENV=development
JWT_SECRET=sua_chave_segura_aqui
```

### 4. Iniciar o Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

Você deve ver:
```
🚀 Servidor rodando na porta 5000
✅ MongoDB conectado com sucesso: localhost
```

### 5. Testar a Conexão

Abra seu navegador em:
```
http://localhost:5000/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "Conectado ao MongoDB"
}
```

### 6. Migrar Frontend (localStorage → API)

Leia o guia em [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

**Resumo:**
- Criar classe wrapper para API
- Converter cada página que usa `localStorage`
- Testar cada funcionalidade
- Remover código obsoleto

---

## 📚 Documentação Essencial

| Arquivo | Conteúdo |
|---------|----------|
| [README.md](./README.md) | Visão geral do projeto |
| [MONGODB_SETUP.md](./MONGODB_SETUP.md) | Instalação e troubleshooting |
| [API_EXAMPLES.md](./API_EXAMPLES.md) | Exemplos de requisições |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Como migrar do localStorage |

---

## 🔧 Estrutura de Pastas Criada

```
TCC-Posto-de-Coleta/
├── config/
│   └── database.js           # Conexão MongoDB
├── models/
│   ├── Paciente.js
│   ├── Medico.js
│   ├── Administrador.js
│   ├── Agendamento.js
│   ├── Especialidade.js
│   ├── Servico.js
│   └── Laudo.js
├── routes/
│   ├── pacientes.js
│   ├── medicos.js
│   ├── administradores.js
│   ├── agendamentos.js
│   ├── especialidades.js
│   ├── servicos.js
│   └── laudos.js
├── controllers/              # (Pronto para lógica de negócio)
├── server.js                 # Servidor Express
├── package.json
├── .env                      # NÃO COMMITAR
├── .env.example
├── .gitignore
├── README.md
├── MONGODB_SETUP.md
├── API_EXAMPLES.md
├── MIGRATION_GUIDE.md
└── SETUP_CHECKLIST.md        # Este arquivo
```

---

## 🧪 Testar Endpoints

### Com curl (Terminal)

```bash
# Listar pacientes
curl http://localhost:5000/api/pacientes

# Criar paciente
curl -X POST http://localhost:5000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "123.456.789-00",
    "telefone": "(48) 98765-4321",
    "dataNascimento": "1990-01-15",
    "genero": "M"
  }'
```

### Com Postman
1. Download: https://www.postman.com/
2. Criar nova requisição
3. Selecionar método (GET, POST, PUT, DELETE)
4. Inserir URL: `http://localhost:5000/api/...`
5. Adicionar headers: `Content-Type: application/json`
6. Adicionar body (JSON)
7. Clicar em Send

---

## ⚙️ Dependências Instaladas

| Pacote | Versão | Propósito |
|--------|--------|----------|
| express | ^4.18.2 | Framework web |
| mongoose | ^7.5.0 | ODM MongoDB |
| dotenv | ^16.3.1 | Variáveis de ambiente |
| bcryptjs | ^2.4.3 | Hash de senhas |
| jsonwebtoken | ^9.0.2 | Autenticação JWT |
| cors | ^2.8.5 | Cross-origin requests |
| helmet | ^7.0.0 | Segurança HTTP |
| express-validator | ^7.0.0 | Validação de dados |
| nodemon | ^3.0.1 | Auto-reload (dev) |

---

## 🔒 Segurança Implementada

- ✅ Senhas com hash bcrypt
- ✅ Validação de entrada
- ✅ CORS configurado
- ✅ Helmet para headers seguros
- ✅ Mongoose schemas com validação
- ✅ JWT pronto para autenticação
- ✅ Variáveis de ambiente sensíveis

---

## 📝 Próximas Melhorias (Futuro)

- [ ] Implementar autenticação JWT completa
- [ ] Adicionar middleware de autenticação
- [ ] Implementar autorização baseada em roles
- [ ] Adicionar paginação nas listas
- [ ] Implementar filtros e busca
- [ ] Adicionar logs estruturados
- [ ] Testes unitários e integração
- [ ] Documentação Swagger/OpenAPI
- [ ] Deploy em produção
- [ ] CI/CD com GitHub Actions

---

## 🐛 Troubleshooting Rápido

### Porta 5000 já em uso
```bash
# Ubuntu/Linux
lsof -i :5000
kill -9 <PID>

# macOS
lsof -i :5000
kill -9 <PID>
```

### MongoDB não conecta
```bash
# Verificar se está rodando
sudo systemctl status mongod

# Iniciar
sudo systemctl start mongod

# Logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Erro de validação
- Verificar schema em `models/`
- Respeitar tipos de dados
- Campos obrigatórios não podem ser vazios

### npm install falha
```bash
# Limpar cache npm
npm cache clean --force

# Tentar novamente
npm install
```

---

## ✅ Checklist Final

- [ ] `npm install` concluído
- [ ] MongoDB instalado e rodando
- [ ] `.env` configurado
- [ ] `npm run dev` iniciado com sucesso
- [ ] `/api/health` retorna status OK
- [ ] Testou GET `/api/pacientes`
- [ ] Testou POST `/api/pacientes` com dados
- [ ] Verificou dados no MongoDB
- [ ] Leu [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- [ ] Começou a migrar frontend

---

## 📞 Ajuda Rápida

- **Servidor não inicia**: Verificar porta 5000, checar `.env`, logs do console
- **MongoDB não conecta**: Instalar MongoDB, verificar URI em `.env`
- **Erro ao criar paciente**: Verificar validação em `models/Paciente.js`
- **Erro CORS**: Frontend e backend em URLs diferentes? Checar `.env` FRONTEND_URL

---

## 🎉 Seu Sistema Está Pronto!

O projeto foi preparado com:
- ✅ Backend Node.js/Express funcional
- ✅ MongoDB integrado e pronto
- ✅ 7 endpoints CRUD completos
- ✅ Segurança básica implementada
- ✅ Documentação abrangente

**Próximo passo**: Siga o [MONGODB_SETUP.md](./MONGODB_SETUP.md) para começar!

---

**Criado em**: 2024
**Status**: ✅ Pronto para desenvolvimento
