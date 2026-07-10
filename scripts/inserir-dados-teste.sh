#!/bin/bash
# Script para inserir dados de teste de pacientes no MongoDB

echo "🚀 Inserindo pacientes de teste no MongoDB..."

# URL da API
API_URL="http://localhost:5000/api"

# Função para inserir paciente
criar_paciente() {
    local nome=$1
    local cpf=$2
    local email=$3
    local telefone=$4
    local dataNascimento=$5
    local genero=$6

    curl -X POST "$API_URL/pacientes" \
        -H "Content-Type: application/json" \
        -d "{
            \"nome\": \"$nome\",
            \"cpf\": \"$cpf\",
            \"email\": \"$email\",
            \"telefone\": \"$telefone\",
            \"dataNascimento\": \"$dataNascimento\",
            \"genero\": \"$genero\",
            \"endereco\": {
                \"rua\": \"Rua Teste\",
                \"numero\": \"123\",
                \"bairro\": \"Centro\",
                \"cidade\": \"Blumenau\",
                \"estado\": \"SC\",
                \"cep\": \"89010-100\"
            },
            \"historicoMedico\": {
                \"alergias\": [\"Penicilina\"],
                \"doencas\": [],
                \"medicamentos\": []
            },
            \"ativo\": true
        }" \
        2>/dev/null
    
    echo ""
}

# Inserir pacientes de teste
echo "📝 Criando paciente 1..."
criar_paciente "João Silva" "123.456.789-00" "joao@example.com" "(48) 98765-4321" "1990-05-15" "M"

echo "📝 Criando paciente 2..."
criar_paciente "Maria Santos" "987.654.321-00" "maria@example.com" "(48) 99876-5432" "1985-03-22" "F"

echo "📝 Criando paciente 3..."
criar_paciente "Carlos Oliveira" "456.789.123-00" "carlos@example.com" "(48) 98765-1111" "1992-07-10" "M"

echo "📝 Criando paciente 4..."
criar_paciente "Ana Costa" "789.123.456-00" "ana@example.com" "(48) 99999-2222" "1988-11-30" "F"

echo "📝 Criando paciente 5..."
criar_paciente "Pedro Ferreira" "321.654.987-00" "pedro@example.com" "(48) 98888-3333" "1995-01-05" "M"

echo ""
echo "✅ Pacientes de teste criados com sucesso!"
echo "🌐 Acesse: http://localhost:3000/consultas/pacientes.html"
