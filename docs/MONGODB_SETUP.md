# Guia de Configuração do MongoDB

## 📋 Pré-requisitos

- Node.js (v14+)
- MongoDB instalado e rodando
- npm ou yarn

## 🚀 Passo 1: Instalar Dependências

```bash
cd /home/aluno/Documentos/TCC-Posto-de-Coleta
npm install
```

## 🗄️ Passo 2: Configurar MongoDB

### Opção 1: MongoDB Local

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS (com Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Opção 2: MongoDB Atlas (Cloud)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster
4. Gere uma string de conexão
5. Atualize o `.env` com sua connection string

## 🔐 Passo 3: Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite `.env` com suas credenciais:
```env
MONGODB_URI=mongodb://localhost:27017/posto-coleta
PORT=5000
NODE_ENV=development
JWT_SECRET=sua_chave_segura_aqui
```

## ✅ Passo 4: Iniciar o Servidor

**Modo desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor estará rodando em `http://localhost:5000`

## 🧪 Passo 5: Verificar Conexão

Acesse em seu navegador:
```
http://localhost:5000/api/health
```

Você deve ver:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "Conectado ao MongoDB"
}
```

## 📚 Estrutura de Rotas da API

### Pacientes
- `GET /api/pacientes` - Listar todos
- `GET /api/pacientes/:id` - Obter por ID
- `POST /api/pacientes` - Criar novo
- `PUT /api/pacientes/:id` - Atualizar
- `DELETE /api/pacientes/:id` - Deletar

### Médicos
- `GET /api/medicos` - Listar todos
- `GET /api/medicos/:id` - Obter por ID
- `POST /api/medicos` - Criar novo
- `PUT /api/medicos/:id` - Atualizar
- `DELETE /api/medicos/:id` - Deletar

### Agendamentos
- `GET /api/agendamentos` - Listar todos
- `GET /api/agendamentos/:id` - Obter por ID
- `POST /api/agendamentos` - Criar novo
- `PUT /api/agendamentos/:id` - Atualizar
- `DELETE /api/agendamentos/:id` - Cancelar

### Especialidades
- `GET /api/especialidades` - Listar todas
- `POST /api/especialidades` - Criar nova
- `PUT /api/especialidades/:id` - Atualizar
- `DELETE /api/especialidades/:id` - Deletar

### Serviços
- `GET /api/servicos` - Listar todos
- `POST /api/servicos` - Criar novo
- `PUT /api/servicos/:id` - Atualizar
- `DELETE /api/servicos/:id` - Deletar

### Laudos
- `GET /api/laudos` - Listar todos
- `POST /api/laudos` - Criar novo
- `PUT /api/laudos/:id` - Atualizar
- `DELETE /api/laudos/:id` - Deletar

## 🔧 Verificar MongoDB

**Ver versão instalada:**
```bash
mongod --version
```

**Conectar ao MongoDB via CLI:**
```bash
mongosh
```

**Ver bancos de dados:**
```
show dbs
```

**Usar banco específico:**
```
use posto-coleta
```

## 📋 Modelo de Requisição (Exemplo)

```javascript
// POST /api/pacientes
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "email": "joao@email.com",
  "telefone": "(48) 98765-4321",
  "dataNascimento": "1990-01-15",
  "genero": "M",
  "endereco": {
    "rua": "Rua Principal",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "Blumenau",
    "estado": "SC",
    "cep": "89010-200"
  },
  "historicoMedico": {
    "alergias": ["Penicilina"],
    "doencas": [],
    "medicamentos": ["Dipirona"]
  },
  "senha": "senha_segura_123"
}
```

## 🐛 Troubleshooting

### MongoDB não conecta
- Verificar se MongoDB está rodando: `sudo systemctl status mongod`
- Checar a URI em `.env`
- Verificar credenciais se usando Atlas

### Porta 5000 já em uso
- Mudar porta em `.env`
- Ou liberar a porta: `lsof -i :5000` e `kill -9 <PID>`

### Erro de validação
- Verificar os schemas em `/models`
- Respeitar tipos de dados esperados

## 📞 Suporte

Para mais informações, consulte:
- [Documentação MongoDB](https://docs.mongodb.com/)
- [Documentação Mongoose](https://mongoosejs.com/)
- [Documentação Express](https://expressjs.com/)
