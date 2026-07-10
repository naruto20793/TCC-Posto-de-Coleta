# 🏥 Posto de Coleta Araranguá - TCC

Sistema completo de gerenciamento de pacientes, consultas e agendamentos para um posto de coleta médica.

---

## 📁 Estrutura do Projeto

```
TCC-Posto-de-Coleta/
├── public/              Frontend (HTML, CSS, JavaScript)
├── backend/             Backend (Express, API, MongoDB)
├── docs/                Documentação completa
├── scripts/             Scripts úteis
├── .env                 Variáveis de ambiente
└── ESTRUTURA.txt        Guia detalhado de pastas
```

**Veja [ESTRUTURA.txt](./ESTRUTURA.txt) para detalhes completos!**

---

## 🚀 Quick Start

### 1. Configurar e Rodar o Backend

```bash
cd backend
npm install
npm run dev
```

O servidor rodará em: `http://localhost:5000`

### 2. Acessar o Frontend

**Opção A - Arquivo Local:**
```
file:///home/aluno/Documentos/TCC-Posto-de-Coleta/public/index.html
```

**Opção B - Via Servidor (quando configurado):**
```
http://localhost:5000/index.html
```

### 3. Login de Teste

Acesse: `http://localhost:5000/login/login-teste.html`

- **Admin:** Acesso total
- **Médico:** Acesso a pacientes e consultas
- **Paciente:** Acesso restrito

---

## ✨ Funcionalidades Principais

### 👥 Pacientes
- ✅ Visualizar lista de pacientes
- ✅ Buscar por nome, CPF, email
- ✅ Ver detalhes completos
- ✅ Controle de acesso (Admin/Médico)

### 📅 Agendamentos
- ✅ Agendar consultas e exames
- ✅ Gerenciar horários
- ✅ Visualizar agenda

### 📄 Laudos
- ✅ Gerar e visualizar laudos
- ✅ Assinatura digital
- ✅ Histórico de laudos

### 👨‍⚕️ Profissionais
- ✅ Lista de médicos
- ✅ Especialidades
- ✅ Horários de atendimento

### 📍 Localização
- ✅ Endereço do centro
- ✅ Mapa interativo
- ✅ Informações de contato

---

## 🔐 Controle de Acesso

| Tipo | Pacientes | Consultas | Laudos | Admin |
|------|-----------|-----------|--------|-------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Médico** | ✅ | ✅ | ✅ | ❌ |
| **Paciente** | ❌ | ✅ | ✅ | ❌ |

---

## 📊 Dados de Teste

5 pacientes já criados no MongoDB:

1. **João Silva** - CPF: 123.456.789-00
2. **Maria Santos** - CPF: 987.654.321-00
3. **Carlos Oliveira** - CPF: 456.789.123-00
4. **Ana Costa** - CPF: 789.123.456-00
5. **Pedro Ferreira** - CPF: 321.654.987-00

**Inserir novos dados:**
```bash
cd scripts
./inserir-dados-teste.sh
```

---

## 🛠️ Stack Tecnológico

### Frontend
- HTML5
- CSS3 (Grid, Flexbox)
- JavaScript ES6+
- Bootstrap 5
- Font Awesome

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Bcryptjs (segurança)
- CORS + Helmet

---

## 📝 Documentação

Veja a pasta `docs/` para documentação completa:

- [LEIA-ME-PRIMEIRO.txt](./docs/LEIA-ME-PRIMEIRO.txt) - Comece aqui!
- [ESTRUTURA.txt](./ESTRUTURA.txt) - Guia de pastas
- [MONGODB_SETUP.md](./docs/MONGODB_SETUP.md) - Configuração do banco
- [API_EXAMPLES.md](./docs/API_EXAMPLES.md) - Exemplos de API
- [TESTE_PAGINA_PACIENTES.md](./docs/TESTE_PAGINA_PACIENTES.md) - Guia de testes

---

## ⚙️ Configuração

Crie um arquivo `.env` na raiz com:

```env
MONGODB_URI=mongodb://localhost:27017/posto-coleta
PORT=5000
NODE_ENV=development
JWT_SECRET=seu_secret_aqui
FRONTEND_URL=http://localhost:5000
```

---

## 🔄 Workflow de Desenvolvimento

1. **Backend:** Rodar servidor em `backend/` com `npm run dev`
2. **Frontend:** Editar arquivos em `public/`
3. **Testes:** Usar `login/login-teste.html` para teste rápido
4. **API:** Testar endpoints em `http://localhost:5000/api/*`

---

## 🐛 Troubleshooting

### Problema: "Nenhum paciente aparece"
```bash
cd backend
npm run dev
# Em outro terminal:
cd scripts
./inserir-dados-teste.sh
```

### Problema: "Aviso de acesso restrito"
Abra console (F12) e cole:
```javascript
definirUsuarioTeste('admin');
window.location.href = '/index.html';
```

### Problema: "MongoDB não conecta"
- Verifique se MongoDB está rodando: `mongod`
- Verifique URI no `.env`
- Veja [MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)

---

## 📈 Próximos Passos

- [ ] Implementar JWT completo
- [ ] Edição e deleção de pacientes
- [ ] Exportação em PDF/CSV
- [ ] Busca avançada
- [ ] Dashboard com gráficos
- [ ] Notificações por email

---

## 👨‍💻 Autor

**Guilherme Pereira Mondardo**
TCC - Gestão de Saúde

---

## 📄 Licença

Este projeto é parte de um TCC e segue as políticas da instituição.

---

## 📧 Suporte

Para dúvidas ou problemas, consulte a documentação em `docs/` ou veja o [LEIA-ME-PRIMEIRO.txt](./docs/LEIA-ME-PRIMEIRO.txt).

---

**Versão:** 2.0 (Reestruturado)  
**Data:** 30/06/2026  
**Status:** ✅ Funcional
