# Exemplos de Uso da API

## 🧪 Testando a API

### Com cURL

#### Criar Paciente
```bash
curl -X POST http://localhost:5000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@example.com",
    "telefone": "(48) 98765-4321",
    "dataNascimento": "1990-01-15T00:00:00Z",
    "genero": "M",
    "endereco": {
      "rua": "Rua Principal",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "Blumenau",
      "estado": "SC",
      "cep": "89010-200"
    },
    "senha": "senha123"
  }'
```

#### Listar Pacientes
```bash
curl http://localhost:5000/api/pacientes
```

#### Obter Paciente por ID
```bash
curl http://localhost:5000/api/pacientes/ID_DO_PACIENTE
```

#### Atualizar Paciente
```bash
curl -X PUT http://localhost:5000/api/pacientes/ID_DO_PACIENTE \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Atualizado",
    "telefone": "(48) 99999-8888"
  }'
```

#### Deletar Paciente
```bash
curl -X DELETE http://localhost:5000/api/pacientes/ID_DO_PACIENTE
```

### Com JavaScript (Fetch API)

#### Criar Paciente
```javascript
const criarPaciente = async () => {
  const response = await fetch('http://localhost:5000/api/pacientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome: 'João Silva',
      cpf: '123.456.789-00',
      email: 'joao@example.com',
      telefone: '(48) 98765-4321',
      dataNascimento: '1990-01-15',
      genero: 'M',
      endereco: {
        rua: 'Rua Principal',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Blumenau',
        estado: 'SC',
        cep: '89010-200'
      },
      senha: 'senha123'
    })
  });
  
  const data = await response.json();
  console.log('Paciente criado:', data);
};

criarPaciente();
```

#### Listar Pacientes
```javascript
const listarPacientes = async () => {
  const response = await fetch('http://localhost:5000/api/pacientes');
  const pacientes = await response.json();
  console.log('Pacientes:', pacientes);
};

listarPacientes();
```

#### Obter Paciente
```javascript
const obterPaciente = async (id) => {
  const response = await fetch(`http://localhost:5000/api/pacientes/${id}`);
  const paciente = await response.json();
  console.log('Paciente:', paciente);
};

obterPaciente('ID_DO_PACIENTE');
```

#### Atualizar Paciente
```javascript
const atualizarPaciente = async (id) => {
  const response = await fetch(`http://localhost:5000/api/pacientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome: 'Novo Nome',
      telefone: '(48) 99999-8888'
    })
  });
  
  const data = await response.json();
  console.log('Paciente atualizado:', data);
};

atualizarPaciente('ID_DO_PACIENTE');
```

#### Deletar Paciente
```javascript
const deletarPaciente = async (id) => {
  const response = await fetch(`http://localhost:5000/api/pacientes/${id}`, {
    method: 'DELETE'
  });
  
  const data = await response.json();
  console.log(data.mensagem);
};

deletarPaciente('ID_DO_PACIENTE');
```

## 👨‍⚕️ Exemplos - Médicos

#### Criar Médico
```bash
curl -X POST http://localhost:5000/api/medicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dr. Carlos Santos",
    "crm": "12345/SC",
    "cpf": "987.654.321-00",
    "email": "carlos@example.com",
    "telefone": "(48) 98765-4321",
    "dataNascimento": "1980-05-20T00:00:00Z",
    "genero": "M",
    "horarioDisponivel": {
      "diasSemana": ["segunda", "terça", "quarta", "quinta", "sexta"],
      "horaInicio": "08:00",
      "horaFim": "17:00"
    },
    "senha": "senha123"
  }'
```

#### Listar Médicos
```bash
curl http://localhost:5000/api/medicos
```

## 📅 Exemplos - Agendamentos

#### Criar Agendamento
```bash
curl -X POST http://localhost:5000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": "ID_PACIENTE",
    "medico": "ID_MEDICO",
    "especialidade": "ID_ESPECIALIDADE",
    "data": "2024-02-15T14:00:00Z",
    "hora": "14:00",
    "duracao": 30,
    "status": "agendado",
    "notas": "Paciente apresenta dor no peito"
  }'
```

#### Listar Agendamentos
```bash
curl http://localhost:5000/api/agendamentos
```

## 🏥 Exemplos - Especialidades

#### Criar Especialidade
```bash
curl -X POST http://localhost:5000/api/especialidades \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Cardiologia",
    "descricao": "Especialidade em doenças do coração"
  }'
```

#### Listar Especialidades
```bash
curl http://localhost:5000/api/especialidades
```

## 💊 Exemplos - Serviços

#### Criar Serviço
```bash
curl -X POST http://localhost:5000/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Eletrocardiograma",
    "descricao": "Exame do coração",
    "especialidade": "ID_CARDIOLOGIA",
    "valor": 150.00,
    "duracao": 30
  }'
```

#### Listar Serviços
```bash
curl http://localhost:5000/api/servicos
```

## 📄 Exemplos - Laudos

#### Criar Laudo
```bash
curl -X POST http://localhost:5000/api/laudos \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": "ID_PACIENTE",
    "medico": "ID_MEDICO",
    "agendamento": "ID_AGENDAMENTO",
    "titulo": "Eletrocardiograma",
    "descricao": "Exame de eletrocardiografia realizado",
    "resultados": "Batimentos normais",
    "conclusao": "Paciente em bom estado",
    "status": "finalizado"
  }'
```

#### Listar Laudos
```bash
curl http://localhost:5000/api/laudos
```

## ✅ Health Check

```bash
curl http://localhost:5000/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "Conectado ao MongoDB"
}
```

## 📝 Observações

- Substitua `ID_PACIENTE`, `ID_MEDICO`, etc pelos IDs reais
- Datas devem estar no formato ISO 8601: `YYYY-MM-DDTHH:MM:SSZ`
- Senhas não são retornadas nas respostas por segurança
- Todos os POST/PUT requerem `Content-Type: application/json`
- O servidor deve estar rodando em `http://localhost:5000`

## 🧪 Ferramenta Recomendada

Para testes mais fáceis, use [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/)
