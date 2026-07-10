// Guia de Uso - Página de Visualização de Pacientes

## 📖 GUIA DE USO - PÁGINA DE PACIENTES

### 🎯 Objetivo
A página `/consultas/pacientes.html` permite que **médicos** e **administradores** visualizem todos os pacientes cadastrados no sistema com detalhes completos.

---

## 🔐 Controle de Acesso

### Quem pode acessar?
- ✅ **Administradores** (tipo: 'admin')
- ✅ **Médicos** (tipo: 'medico')
- ❌ **Pacientes** (acesso bloqueado)
- ❌ **Visitantes** (acesso bloqueado)

### Como o acesso é validado?
O código verifica `localStorage.usuarioAtual.tipo` e bloqueia acesso se não autorizado.

---

## 🚀 Como Testar

### 1️⃣ Pré-requisitos
- Servidor Node.js rodando (`npm run dev`)
- MongoDB rodando
- Dados de teste carregados

### 2️⃣ Inserir Dados de Teste
```bash
cd /home/aluno/Documentos/TCC-Posto-de-Coleta
chmod +x scripts/inserir-dados-teste.sh
./scripts/inserir-dados-teste.sh
```

Ou com curl direto:
```bash
curl -X POST http://localhost:5000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@example.com",
    "telefone": "(48) 98765-4321",
    "dataNascimento": "1990-05-15",
    "genero": "M",
    "endereco": {
      "rua": "Rua Principal",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "Blumenau",
      "estado": "SC"
    }
  }'
```

### 3️⃣ Definir Usuário de Teste (no Console do Navegador)
```javascript
// Definir como Admin
definirUsuarioTeste('admin');

// Definir como Médico
definirUsuarioTeste('medico');

// Ou manualmente
localStorage.setItem('usuarioAtual', JSON.stringify({
    tipo: 'admin',
    nome: 'Admin Test',
    id: '1'
}));
```

### 4️⃣ Acessar a Página
Se usando arquivo local (sem servidor HTTP):
- Copie os arquivos para um servidor web local
- Ou use Live Server do VS Code

```
http://localhost:3000/consultas/pacientes.html
```

---

## 🎨 Funcionalidades

### 📊 Estatísticas
- **Total de Pacientes**: Conta todos os pacientes cadastrados
- **Pacientes Ativos**: Conta apenas os com status ativo

### 🔍 Busca e Filtro
- Buscar por **nome**
- Buscar por **CPF**
- Buscar por **email**
- Filtro em tempo real (enquanto digita)

### 📋 Tabela de Pacientes
Exibe:
- ID (resumido)
- Nome
- CPF (formatado)
- Email (com link mailto)
- Telefone (com link tel)
- Data de Nascimento
- Gênero
- Status (Ativo/Inativo)
- Botão "Ver Detalhes"

### 👁️ Ver Detalhes Completos
Abre modal com:
- Dados pessoais
- Endereço completo
- Histórico médico (alergias, doenças, medicamentos, cirurgias)
- Contatos de emergência
- Data de cadastro e última atualização

### 🔄 Atualizar Lista
Botão para recarregar dados da API

---

## 📱 Responsividade

A página é responsiva para:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (até 767px)

Em telas pequenas:
- Coluna de ID é ocultada
- Tabela usa scroll horizontal
- Botões são reorganizados

---

## 🎯 Estrutura de Pastas

```
consultas/
├── pacientes.html          # Página principal
├── pacientes.js            # Lógica e interação
├── pacientes.css           # Estilos
└── consultas.css          # Estilos legados (opcional)
```

---

## 🔗 URLs e Rotas

| Recurso | URL |
|---------|-----|
| Página | `/consultas/pacientes.html` |
| API - Listar | `GET /api/pacientes` |
| API - Um | `GET /api/pacientes/:id` |
| API - Criar | `POST /api/pacientes` |
| API - Atualizar | `PUT /api/pacientes/:id` |
| API - Deletar | `DELETE /api/pacientes/:id` |

---

## 🐛 Troubleshooting

### Página em branco
- Verificar console (F12) por erros
- Verificar se servidor está rodando
- Verificar se MongoDB está rodando

### Nenhum paciente aparece
- Verificar se há dados no MongoDB: `GET /api/pacientes`
- Rodar script de inserção de teste
- Verificar console por erros de requisição

### Aviso de "Acesso Restrito"
- Definir usuário com `definirUsuarioTeste('admin')` ou `definirUsuarioTeste('medico')`
- Verificar valor em `localStorage.usuarioAtual.tipo`

### Botão "Ver Detalhes" não funciona
- Verificar console por erros
- Verificar se modal está sendo carregado

### Filtro não funciona
- Verificar se está digitando na caixa de busca
- Verificar console por erros

---

## 📝 Exemplos de Código

### Verificar Permissão Antes de Acessar
```javascript
// No seu HTML ou JS
if (auth.temPermissao(['admin', 'medico'])) {
    // Mostrar conteúdo
} else {
    // Redirecionar
    window.location.href = '/login/login.html';
}
```

### Carregar Pacientes via API
```javascript
const pacientes = await fetch('http://localhost:5000/api/pacientes')
    .then(r => r.json());
console.log(pacientes);
```

### Criar Novo Paciente
```javascript
const novoPaciente = {
    nome: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao@example.com',
    telefone: '(48) 98765-4321',
    dataNascimento: '1990-05-15',
    genero: 'M'
};

const response = await fetch('http://localhost:5000/api/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novoPaciente)
});

const resultado = await response.json();
console.log(resultado);
```

---

## 🔐 Segurança

### Informações Sensíveis
- ✅ Emails com links mailto
- ✅ Telefones com links tel
- ✅ CPF formatado e visível
- ⚠️ Histórico médico visível (apenas para médicos/admins)

### Melhorias Futuras
- [ ] Autenticação JWT completa
- [ ] Verificação de permissão no backend
- [ ] Logs de auditoria
- [ ] Criptografia de dados sensíveis
- [ ] Rate limiting

---

## 📊 Dados Mínimos para Paciente

Para criar um paciente via API, envie:
```json
{
    "nome": "string (obrigatório)",
    "cpf": "string (obrigatório, único)",
    "email": "string (obrigatório, válido)",
    "telefone": "string (obrigatório)",
    "dataNascimento": "date (obrigatório)",
    "genero": "M|F|Outro (obrigatório)",
    "endereco": {
        "rua": "string",
        "numero": "string",
        "complemento": "string",
        "bairro": "string",
        "cidade": "string",
        "estado": "string",
        "cep": "string"
    },
    "historicoMedico": {
        "alergias": ["string"],
        "doencas": ["string"],
        "medicamentos": ["string"],
        "cirurgias": ["string"]
    },
    "contatos": [{
        "tipo": "string",
        "nome": "string",
        "telefone": "string"
    }]
}
```

---

## ✅ Checklist de Uso

- [ ] Servidor Node.js rodando (`npm run dev`)
- [ ] MongoDB rodando
- [ ] Dados de teste inseridos
- [ ] Usuário definido como admin ou médico
- [ ] Página acessível em navegador
- [ ] Tabela carregando pacientes
- [ ] Busca/filtro funcionando
- [ ] Modal de detalhes abrindo
- [ ] Estatísticas atualizando

---

**Última atualização**: 2024
**Versão**: 1.0
