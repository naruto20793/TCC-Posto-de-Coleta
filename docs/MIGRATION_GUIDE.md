# Guia de Migração: localStorage → MongoDB

Este documento explica como migrar seu código frontend do `localStorage` para a API MongoDB.

## 📊 Comparação

### localStorage (Atual)
```javascript
// Salvar
localStorage.setItem('pacientes', JSON.stringify(pacientes));

// Recuperar
const pacientes = JSON.parse(localStorage.getItem('pacientes'));

// Deletar
localStorage.removeItem('pacientes');
```

### MongoDB API (Novo)
```javascript
// Salvar/Criar
fetch('http://localhost:5000/api/pacientes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paciente)
});

// Recuperar
fetch('http://localhost:5000/api/pacientes');

// Deletar
fetch(`http://localhost:5000/api/pacientes/${id}`, { method: 'DELETE' });
```

## 🔄 Padrão de Migração

### 1. Classe Wrapper (Compatibilidade)

Crie uma classe que encapsula as operações para facilitar a migração:

```javascript
// api/Database.js
class Database {
    constructor(baseUrl = 'http://localhost:5000/api') {
        this.baseUrl = baseUrl;
    }

    async setItem(collection, data) {
        const response = await fetch(`${this.baseUrl}/${collection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`Erro ao salvar ${collection}`);
        return await response.json();
    }

    async getItem(collection, id = null) {
        const url = id 
            ? `${this.baseUrl}/${collection}/${id}`
            : `${this.baseUrl}/${collection}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro ao carregar ${collection}`);
        return await response.json();
    }

    async removeItem(collection, id) {
        const response = await fetch(`${this.baseUrl}/${collection}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`Erro ao deletar ${collection}`);
        return await response.json();
    }

    async updateItem(collection, id, data) {
        const response = await fetch(`${this.baseUrl}/${collection}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`Erro ao atualizar ${collection}`);
        return await response.json();
    }
}

const db = new Database();
```

### 2. Converter Código Existente

#### Antes (localStorage)
```javascript
// assets/database.js
class Database {
    initCollection(nome, valorPadrao) {
        if (!localStorage.getItem(nome)) {
            localStorage.setItem(nome, JSON.stringify(valorPadrao));
        }
    }

    salvarPaciente(paciente) {
        const pacientes = this.obterPacientes();
        pacientes.push(paciente);
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
    }

    obterPacientes() {
        return JSON.parse(localStorage.getItem('pacientes')) || [];
    }
}
```

#### Depois (MongoDB)
```javascript
// api/Database.js
class Database {
    async salvarPaciente(paciente) {
        const response = await fetch('http://localhost:5000/api/pacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paciente)
        });
        return await response.json();
    }

    async obterPacientes() {
        const response = await fetch('http://localhost:5000/api/pacientes');
        return await response.json();
    }
}
```

### 3. Atualizar Código Frontend

#### Exemplo: Cadastro de Paciente

**Antes:**
```javascript
// cadastro/paciente/paciente.js
document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const paciente = {
        id: Date.now(),
        nome: document.querySelector('[name="nome"]').value,
        email: document.querySelector('[name="email"]').value,
        // ... mais campos
    };
    
    db.salvarPaciente(paciente);
    alert('Paciente salvo!');
});
```

**Depois:**
```javascript
// cadastro/paciente/paciente.js
document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const paciente = {
        nome: document.querySelector('[name="nome"]').value,
        email: document.querySelector('[name="email"]').value,
        // ... mais campos
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/pacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paciente)
        });
        
        if (response.ok) {
            const novoPaciente = await response.json();
            alert('Paciente salvo!');
            // Redirecionar ou limpar formulário
        } else {
            const erro = await response.json();
            alert(`Erro: ${erro.error}`);
        }
    } catch (error) {
        alert(`Erro na conexão: ${error.message}`);
    }
});
```

#### Exemplo: Listar Pacientes

**Antes:**
```javascript
// consultas/consultas.js
const pacientes = db.obterPacientes();
pacientes.forEach(p => {
    // Renderizar paciente
});
```

**Depois:**
```javascript
// consultas/consultas.js
async function carregarPacientes() {
    try {
        const response = await fetch('http://localhost:5000/api/pacientes');
        const pacientes = await response.json();
        
        pacientes.forEach(p => {
            // Renderizar paciente
        });
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
    }
}

// Chamar na inicialização
carregarPacientes();
```

#### Exemplo: Deletar Paciente

**Antes:**
```javascript
function deletarPaciente(id) {
    const pacientes = db.obterPacientes();
    const index = pacientes.findIndex(p => p.id === id);
    pacientes.splice(index, 1);
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
}
```

**Depois:**
```javascript
async function deletarPaciente(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/pacientes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Paciente deletado com sucesso');
            carregarPacientes(); // Recarregar lista
        }
    } catch (error) {
        console.error('Erro ao deletar:', error);
    }
}
```

## 🌐 Estrutura de URLs

| Operação | Method | URL |
|----------|--------|-----|
| Listar | GET | `/api/{colecao}` |
| Obter um | GET | `/api/{colecao}/{id}` |
| Criar | POST | `/api/{colecao}` |
| Atualizar | PUT | `/api/{colecao}/{id}` |
| Deletar | DELETE | `/api/{colecao}/{id}` |

## 🔁 Padrão de Requisição Assíncrona

Use esta função auxiliar para simplificar requisições:

```javascript
// api/request.js
async function apiRequest(method, endpoint, data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`http://localhost:5000/api${endpoint}`, options);
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error || `Erro ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erro em ${method} ${endpoint}:`, error);
        throw error;
    }
}

// Uso
const paciente = await apiRequest('POST', '/pacientes', { nome: 'João' });
const pacientes = await apiRequest('GET', '/pacientes');
await apiRequest('DELETE', `/pacientes/${id}`);
```

## 📋 Checklista de Migração

- [ ] Instalar dependências Node.js (`npm install`)
- [ ] Configurar MongoDB e variáveis de ambiente (`.env`)
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Testar endpoints com curl/Postman
- [ ] Criar classe/função wrapper para API
- [ ] Migrar cadastro de pacientes
- [ ] Migrar listagem de pacientes
- [ ] Migrar edição de pacientes
- [ ] Migrar deleção de pacientes
- [ ] Migrar agendamentos
- [ ] Migrar consultas
- [ ] Migrar médicos
- [ ] Migrar laudos
- [ ] Testar toda a aplicação
- [ ] Remover localStorage obsoleto

## ⚠️ Considerações Importantes

### IDs
- **localStorage**: IDs manuais (ex: `Date.now()`, incremento)
- **MongoDB**: IDs automáticos (ObjectId de 24 caracteres)
  
Atualize seu código para usar IDs do MongoDB:
```javascript
const paciente = await apiRequest('POST', '/pacientes', dados);
console.log(paciente._id); // Use _id do MongoDB, não id
```

### Senhas
- **localStorage**: Armazenadas em texto simples ❌
- **MongoDB**: Criptografadas com bcrypt ✅

Não envie/armazene senhas no frontend!

### Performance
- **localStorage**: Síncronas, rápidas ⚡
- **MongoDB**: Assíncronas, mais seguras 🔒

Sempre use `async/await` ou `.then()` para requisições

### Validação
- **localStorage**: Nenhuma
- **MongoDB**: Schemas Mongoose validam dados ✅

O backend agora valida dados automaticamente

## 🧪 Testar Migração

```javascript
// Teste em console do navegador
async function testarAPI() {
    // 1. Criar paciente
    const novo = await fetch('http://localhost:5000/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome: 'Teste',
            email: 'teste@example.com',
            cpf: '123.456.789-00',
            telefone: '(48) 98765-4321',
            dataNascimento: '1990-01-01',
            genero: 'M'
        })
    }).then(r => r.json());
    
    console.log('Criado:', novo);
    
    // 2. Listar pacientes
    const lista = await fetch('http://localhost:5000/api/pacientes')
        .then(r => r.json());
    console.log('Pacientes:', lista);
    
    // 3. Buscar um
    const um = await fetch(`http://localhost:5000/api/pacientes/${novo._id}`)
        .then(r => r.json());
    console.log('Um paciente:', um);
    
    // 4. Atualizar
    const atualizado = await fetch(`http://localhost:5000/api/pacientes/${novo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: '(48) 99999-9999' })
    }).then(r => r.json());
    console.log('Atualizado:', atualizado);
    
    // 5. Deletar
    await fetch(`http://localhost:5000/api/pacientes/${novo._id}`, {
        method: 'DELETE'
    });
    console.log('Deletado');
}

testarAPI();
```

---

**Próximo passo**: Leia [API_EXAMPLES.md](./API_EXAMPLES.md) para exemplos completos
