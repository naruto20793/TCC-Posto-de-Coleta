#!/bin/bash

# Script de teste rápido da página de pacientes

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 TESTE RÁPIDO - PÁGINA DE PACIENTES PARA MÉDICOS/ADMINS  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 ARQUIVOS CRIADOS:${NC}"
echo "  ✓ /consultas/pacientes.html - Página de visualização"
echo "  ✓ /consultas/pacientes.js - Lógica e API"
echo "  ✓ /consultas/pacientes.css - Estilos"
echo "  ✓ /login/login-teste.html - Login para teste"
echo "  ✓ /assets/auth.js - Sistema de autenticação"
echo ""

echo -e "${BLUE}🔒 CONTROLE DE ACESSO:${NC}"
echo "  ✓ Apenas MÉDICOS e ADMINS podem acessar"
echo "  ✓ Pacientes veem aviso de acesso restrito"
echo ""

echo -e "${YELLOW}⚠️  PRÉ-REQUISITOS:${NC}"
echo "  1. Servidor Node.js rodando: npm run dev"
echo "  2. MongoDB rodando"
echo "  3. Dados de teste inseridos"
echo ""

echo -e "${GREEN}🚀 PASSO 1: Verificar servidor${NC}"
response=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if [[ $response == *"OK"* ]]; then
    echo -e "  ${GREEN}✓ Servidor respondendo em http://localhost:5000${NC}"
else
    echo -e "  ${RED}✗ Servidor não respondendo. Execute: npm run dev${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}🚀 PASSO 2: Inserir dados de teste${NC}"
echo "  Execute um dos comandos abaixo:"
echo ""
echo -e "  ${YELLOW}Opção A - Script shell:${NC}"
echo "    chmod +x scripts/inserir-dados-teste.sh"
echo "    ./scripts/inserir-dados-teste.sh"
echo ""
echo -e "  ${YELLOW}Opção B - Com curl diretamente:${NC}"
echo "    curl -X POST http://localhost:5000/api/pacientes \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"nome\":\"João Silva\",\"cpf\":\"123.456.789-00\",\"email\":\"joao@example.com\",\"telefone\":\"(48) 98765-4321\",\"dataNascimento\":\"1990-05-15\",\"genero\":\"M\"}'"
echo ""

echo -e "${GREEN}🚀 PASSO 3: Acessar a página${NC}"
echo ""
echo -e "  ${YELLOW}Opção A - Com Live Server (VS Code):${NC}"
echo "    1. Clique com botão direito em login/login-teste.html"
echo "    2. Selecione 'Open with Live Server'"
echo "    3. Página abrirá em http://localhost:5500/login/login-teste.html"
echo ""
echo -e "  ${YELLOW}Opção B - No console do navegador:${NC}"
echo "    1. Abra DevTools (F12)"
echo "    2. Cole no console:"
echo "       definirUsuarioTeste('admin')"
echo "       window.location.href = 'consultas/pacientes.html'"
echo ""
echo -e "  ${YELLOW}Opção C - Direto no navegador:${NC}"
echo "    1. Acesse: http://localhost:5500/login/login-teste.html"
echo "    2. Selecione tipo de usuário (Admin ou Médico)"
echo "    3. Clique em 'Entrar'"
echo ""

echo -e "${GREEN}✅ TESTES DISPONÍVEIS:${NC}"
echo "  1. Admin pode ver: ✓ Lista completa"
echo "  2. Médico pode ver: ✓ Lista completa"
echo "  3. Paciente vê: ✗ Aviso de acesso restrito"
echo ""

echo -e "${BLUE}📁 ESTRUTURA:${NC}"
echo "  consultas/"
echo "  ├── pacientes.html (página principal)"
echo "  ├── pacientes.js (lógica)"
echo "  └── pacientes.css (estilos)"
echo ""

echo -e "${BLUE}🔗 ENDPOINTS DA API:${NC}"
echo "  GET    /api/pacientes - Listar todos"
echo "  GET    /api/pacientes/:id - Obter um"
echo "  POST   /api/pacientes - Criar"
echo "  PUT    /api/pacientes/:id - Atualizar"
echo "  DELETE /api/pacientes/:id - Deletar"
echo ""

echo -e "${BLUE}📝 FUNCIONALIDADES:${NC}"
echo "  ✓ Buscar por nome ou CPF"
echo "  ✓ Filtro em tempo real"
echo "  ✓ Estatísticas (total, ativos)"
echo "  ✓ Ver detalhes completos (modal)"
echo "  ✓ Formatação de dados (CPF, telefone, datas)"
echo "  ✓ Responsivo (desktop, tablet, mobile)"
echo ""

echo -e "${YELLOW}💡 DICAS:${NC}"
echo "  • Testar com console: definirUsuarioTeste('admin')"
echo "  • Ver log de pacientes: fetch('http://localhost:5000/api/pacientes').then(r => r.json()).then(p => console.log(p))"
echo "  • Verificar localStorage: localStorage.getItem('usuarioAtual')"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     TUDO PRONTO PARA TESTAR!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
