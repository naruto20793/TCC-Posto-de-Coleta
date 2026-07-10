# 📋 PÁGINA DE PACIENTES - GUIA DE TESTE

> Página restrita para **médicos** e **administradores** visualizarem pacientes cadastrados

## ✅ O QUE FOI CRIADO

### 📄 Arquivos HTML/CSS/JS
```
consultas/pacientes.html      # Página principal
consultas/pacientes.js        # Lógica e integração com API
consultas/pacientes.css       # Estilos responsivos
```

### 🔐 Sistema de Autenticação
```
assets/auth.js                # Gerenciador de autenticação
login/login-teste.html        # Página de login para teste
```

### 📊 Dados de Teste
```
scripts/inserir-dados-teste.sh  # Script para inserir pacientes
```

---

## 🚀 GUIA RÁPIDO DE TESTE (5 MINUTOS)

### 1️⃣ Verificar Servidor (Terminal)
```bash
# Verificar se está rodando
curl http://localhost:5000/api/health

# Deve retornar:
# {"status":"OK","timestamp":"...","database":"Conectado ao MongoDB"}
```

### 2️⃣ Inserir Dados de Teste (Terminal)
```bash
cd /home/aluno/Documentos/TCC-Posto-de-Coleta

# Opção A: Com script
chmod +x scripts/inserir-dados-teste.sh
./scripts/inserir-dados-teste.sh

# Opção B: Com curl
curl -X POST http://localhost:5000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","cpf":"123.456.789-00","email":"joao@example.com","telefone":"(48) 98765-4321","dataNascimento":"1990-05-15","genero":"M"}'
```

### 3️⃣ Definir Usuário Teste (Console do Navegador - F12)
```javascript
// Defina como admin
definirUsuarioTeste('admin');

// Ou manualmente
localStorage.setItem('usuarioAtual', JSON.stringify({
    tipo: 'admin',
    nome: 'Administrador',
    id: '1'
}));
```

### 4️⃣ Acessar a Página

**Com Live Server (VS Code):**
1. Clique direito em `login/login-teste.html`
2. Selecione "Open with Live Server"
3. Selecione tipo de usuário
4. Clique "Entrar"

**Ou direto com URL:**
```
file:///home/aluno/Documentos/TCC-Posto-de-Coleta/login/login-teste.html
```

---

## 🎯 CENÁRIOS DE TESTE

### ✅ Teste 1: Admin Acessando
```javascript
definirUsuarioTeste('admin');
window.location.href = '/consultas/pacientes.html';
```
**Resultado esperado:** ✓ Lista de pacientes carregada normalmente

### ✅ Teste 2: Médico Acessando
```javascript
definirUsuarioTeste('medico');
window.location.href = '/consultas/pacientes.html';
```
**Resultado esperado:** ✓ Lista de pacientes carregada normalmente

### ❌ Teste 3: Paciente Acessando
```javascript
definirUsuarioTeste('paciente');
window.location.href = '/consultas/pacientes.html';
```
**Resultado esperado:** ✗ Aviso "Acesso Restrito" e tabela desabilitada

### ❌ Teste 4: Sem Autenticação
```javascript
localStorage.removeItem('usuarioAtual');
window.location.href = '/consultas/pacientes.html';
```
**Resultado esperado:** ✗ Sem tipo de usuário definido, acesso bloqueado

---

## 🎨 FUNCIONALIDADES A TESTAR

### 🔍 Busca e Filtro
1. Abra a página
2. Veja a tabela com todos os pacientes
3. Teste buscas:
   - Buscar por nome: `João`
   - Buscar por CPF: `123.456.789`
   - Buscar por email: `@example.com`

### 👁️ Ver Detalhes
1. Clique em "👁️ Ver" em qualquer paciente
2. Modal abre com dados completos:
   - Dados pessoais
   - Endereço
   - Histórico médico
   - Contatos de emergência
   - Datas

### 📊 Estatísticas
1. Verifique "Total de Pacientes"
2. Verifique "Pacientes Ativos"
3. Clique "🔄 Atualizar" e confirme que números atualizam

### 📱 Responsividade
1. Abra DevTools (F12)
2. Redimensione para diferentes tamanhos:
   - Desktop (1200px+)
   - Tablet (768px)
   - Mobile (480px)
3. Verifique que tabela se adapta

---

## 🐛 TROUBLESHOOTING

### Problema: "Nenhum paciente encontrado"
**Solução:** Inserir dados de teste
```bash
./scripts/inserir-dados-teste.sh
```

### Problema: Tabela aparece desabilitada
**Solução:** Verificar tipo de usuário
```javascript
console.log(auth.obterUsuario());
// Deve ser admin ou medico
```

### Problema: Botão "Ver Detalhes" não funciona
**Solução:** Verificar console por erros (F12)
```javascript
// Testar manualmente
const pacientes = await fetch('http://localhost:5000/api/pacientes').then(r => r.json());
console.log(pacientes);
```

### Problema: Página em branco
**Solução:** Verificar console por erros e se servidor está rodando
```bash
# Terminal
npm run dev

# Console do navegador
console.log('check');
```

---

## 📝 VERIFICAÇÃO PASSO A PASSO

### Checklist Inicial
- [ ] Servidor Node.js rodando (`npm run dev`)
- [ ] MongoDB rodando
- [ ] Nenhuma erro em `npm run dev`

### Checklist de Dados
- [ ] Inserir dados com script
- [ ] Verificar com: `curl http://localhost:5000/api/pacientes`
- [ ] Ver resposta JSON com pacientes

### Checklist de Autenticação
- [ ] Definir usuário como admin
- [ ] Verificar localStorage
- [ ] Acessar página de pacientes

### Checklist de Funcionalidades
- [ ] Tabela carrega
- [ ] Busca funciona
- [ ] Modal abre
- [ ] Estatísticas atualizam
- [ ] Responsivo funciona

---

## 🔗 URLs IMPORTANTES

| O Quê | URL |
|-------|-----|
| Login de Teste | `file:///...consultas/login/login-teste.html` |
| Página de Pacientes | `file:///...consultas/pacientes.html` |
| API - Listar | `http://localhost:5000/api/pacientes` |
| Health Check | `http://localhost:5000/api/health` |

---

## 💻 CÓDIGO DE TESTE NO CONSOLE

### Testar com dados reais
```javascript
// 1. Definir como admin
definirUsuarioTeste('admin');

// 2. Carregar pacientes
const pacientes = await fetch('http://localhost:5000/api/pacientes').then(r => r.json());
console.log('Pacientes:', pacientes);

// 3. Verificar estatísticas
console.log('Total:', pacientes.length);
console.log('Ativos:', pacientes.filter(p => p.ativo).length);

// 4. Verificar um paciente
console.log('Primeiro:', pacientes[0]);
```

### Criar novo paciente
```javascript
const novo = {
    nome: 'Teste Silva',
    cpf: '999.999.999-99',
    email: 'teste@example.com',
    telefone: '(48) 99999-9999',
    dataNascimento: '1995-01-01',
    genero: 'M'
};

const response = await fetch('http://localhost:5000/api/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novo)
});

const resultado = await response.json();
console.log('Criado:', resultado);
```

---

## 🎬 DEMONSTRAÇÃO COMPLETA

1. **Terminal 1** - Verificar servidor:
```bash
npm run dev
# Deve mostrar: 🚀 Servidor rodando na porta 5000
```

2. **Terminal 2** - Inserir dados:
```bash
./scripts/inserir-dados-teste.sh
# Deve criar 5 pacientes
```

3. **Navegador** - Testar:
```javascript
// Console (F12)
definirUsuarioTeste('admin');
window.location.reload();
```

4. **Página** - Verificar:
- Tabela com pacientes
- Busca funcionando
- Modal com detalhes
- Estatísticas corretas

---

## ✨ FEATURES IMPLEMENTADAS

### 🔐 Segurança
- ✅ Controle de acesso por tipo
- ✅ Senha não retornada pela API
- ✅ Validação de entrada

### 📊 Interface
- ✅ Tabela responsiva
- ✅ Modal com detalhes
- ✅ Formatação de dados (CPF, telefone, data)
- ✅ Ícones e cores
- ✅ Animações suaves

### 🔍 Funcionalidades
- ✅ Busca em tempo real
- ✅ Filtro por nome/CPF/email
- ✅ Estatísticas em tempo real
- ✅ Atualizar dados
- ✅ Ver detalhes completos

### 📱 Responsividade
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [MONGODB_SETUP.md](./MONGODB_SETUP.md) - Setup do MongoDB
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Exemplos de requisições
- [USANDO_PAGINA_PACIENTES.md](./USANDO_PAGINA_PACIENTES.md) - Guia completo
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migração do localStorage

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar tudo que está acima** ✓
2. **Criar páginas similares para:**
   - [ ] Médicos (admin/médico)
   - [ ] Agendamentos (admin/médico/paciente)
   - [ ] Laudos (admin/médico)
   - [ ] Serviços (admin)

3. **Implementar:**
   - [ ] Autenticação JWT completa
   - [ ] Middleware de autenticação
   - [ ] Logs de auditoria
   - [ ] Busca avançada
   - [ ] Paginação
   - [ ] Exportar para PDF/CSV

---

**Status:** ✅ Pronto para Teste
**Última atualização:** 2024
**Versão:** 1.0
