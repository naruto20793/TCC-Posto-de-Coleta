#!/bin/bash

echo "🔄 Reorganizando estrutura do projeto..."

# 1. Criar pastas principais
mkdir -p public
mkdir -p backend
mkdir -p docs
mkdir -p public/assets

# 2. Mover frontend (arquivos HTML, CSS, JS, pastas de páginas)
echo "📁 Movendo arquivos frontend..."

# Arquivo principal e estilos
mv index.html public/ 2>/dev/null
mv style.css public/ 2>/dev/null
mv global.css public/ 2>/dev/null
mv script.js public/ 2>/dev/null

# Pastas do frontend
for dir in agendamento cadastro consultas laudo localizacao login perfil profissionais servicos; do
    [ -d "$dir" ] && mv "$dir" "public/$dir" 2>/dev/null
done

# Mover imagens
[ -d "imagens" ] && mv imagens public/assets/ 2>/dev/null

# Assets (navbar e autenticação)
mv assets/navbar.js public/assets/ 2>/dev/null
mv assets/navbar.css public/assets/ 2>/dev/null
mv assets/auth.js public/assets/ 2>/dev/null
mv assets/database.js public/assets/ 2>/dev/null

# 3. Mover backend
echo "📁 Movendo arquivos backend..."

mv server.js backend/ 2>/dev/null
mv package.json backend/ 2>/dev/null
mv package-lock.json backend/ 2>/dev/null

# Mover modelos e rotas
[ -d "models" ] && mv models backend/ 2>/dev/null
[ -d "routes" ] && mv routes backend/ 2>/dev/null
[ -d "config" ] && mv config backend/ 2>/dev/null

# 4. Mover documentação
echo "📁 Movendo documentação..."

mv LEIA-ME-PRIMEIRO.txt docs/ 2>/dev/null
mv LEIA-ME.txt docs/ 2>/dev/null
mv COMECE_AQUI.txt docs/ 2>/dev/null
mv PRONTO_PARA_TESTE.html docs/ 2>/dev/null
mv RESUMO_PAGINA_PACIENTES.md docs/ 2>/dev/null
mv TESTE_PAGINA_PACIENTES.md docs/ 2>/dev/null
mv USANDO_PAGINA_PACIENTES.md docs/ 2>/dev/null
mv SUMARIO_CRIADO.txt docs/ 2>/dev/null
mv API_EXAMPLES.md docs/ 2>/dev/null
mv MIGRATION_GUIDE.md docs/ 2>/dev/null
mv MONGODB_SETUP.md docs/ 2>/dev/null
mv SETUP_CHECKLIST.md docs/ 2>/dev/null

# 5. Arquivos raiz úteis
mv README.md docs/ 2>/dev/null
mv teste-rapido.sh scripts/ 2>/dev/null

# 6. Limpar pastas vazias
rmdir assets 2>/dev/null
rmdir controllers 2>/dev/null

echo "✅ Reorganização concluída!"
echo ""
echo "Nova estrutura:"
echo "├── public/              (Frontend - HTML, CSS, JS)"
echo "├── backend/             (Backend - Express, Models, Routes)"
echo "├── docs/                (Documentação)"
echo "├── scripts/             (Scripts úteis)"
echo "├── .env                 (Configurações)"
echo "└── ESTRUTURA.txt        (Guia de estrutura)"
