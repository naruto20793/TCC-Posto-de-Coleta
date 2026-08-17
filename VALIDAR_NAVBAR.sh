# 🔧 SCRIPTS DE VALIDAÇÃO - LINHA DE COMANDO

**Arquivo:** `/home/aluno/Downloads/TCC-Posto-de-Coleta/VALIDAR_NAVBAR.sh`

Salve este arquivo como `VALIDAR_NAVBAR.sh` e execute: `bash VALIDAR_NAVBAR.sh`

---

## 📝 Script Completo

```bash
#!/bin/bash

# =========================================
# SCRIPTS DE VALIDAÇÃO - NAVBAR HTML
# =========================================

set -e  # Sair em caso de erro

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔍 VALIDADOR DE NAVBAR - TCC Posto de Coleta Araranguá  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# =========================================
# FUNÇÃO: Verificar arquivo HTML
# =========================================
check_html_file() {
    local file=$1
    local depth=$2  # Profundidade (subpasta ou subsubpasta)
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📄 Verificando: $file${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $file${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    local file_passed=0
    local file_warnings=0
    
    # Verificação 1: Bootstrap CSS
    if grep -q "bootstrap.*css" "$file"; then
        echo -e "${GREEN}✅ Bootstrap CSS${NC}"
        file_passed=$((file_passed + 1))
    else
        echo -e "${RED}❌ Bootstrap CSS faltando${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Verificação 2: Font Awesome
    if grep -q "font-awesome\|fontawesome" "$file"; then
        echo -e "${GREEN}✅ Font Awesome${NC}"
        file_passed=$((file_passed + 1))
    else
        echo -e "${YELLOW}⚠️  Font Awesome faltando${NC}"
        file_warnings=$((file_warnings + 1))
    fi
    
    # Verificação 3: Placeholder da navbar
    if grep -q "navbarPlaceholder" "$file"; then
        echo -e "${GREEN}✅ Navbar placeholder${NC}"
        file_passed=$((file_passed + 1))
    else
        if grep -q "navbarPrincipal" "$file"; then
            echo -e "${YELLOW}⚠️  Navbar em HTML estático (não dinâmico)${NC}"
            file_warnings=$((file_warnings + 1))
        else
            echo -e "${RED}❌ Navbar não encontrada${NC}"
            FAILED=$((FAILED + 1))
            return 1
        fi
    fi
    
    # Verificação 4: Script navbar.js
    if grep -q "navbar.js" "$file"; then
        echo -e "${GREEN}✅ Script navbar.js${NC}"
        file_passed=$((file_passed + 1))
    else
        echo -e "${RED}❌ Script navbar.js faltando${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Verificação 5: global.css
    if grep -q "global.css" "$file"; then
        echo -e "${GREEN}✅ global.css${NC}"
        file_passed=$((file_passed + 1))
    else
        echo -e "${YELLOW}⚠️  global.css faltando${NC}"
        file_warnings=$((file_warnings + 1))
    fi
    
    # Verificação 6: Ordem de CSS (global.css deve vir ANTES de navbar.css)
    local global_line=$(grep -n "global.css" "$file" | head -1 | cut -d: -f1)
    local navbar_line=$(grep -n "navbar.css" "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$global_line" ] && [ -n "$navbar_line" ]; then
        if [ "$global_line" -lt "$navbar_line" ]; then
            echo -e "${GREEN}✅ Ordem de CSS correta${NC}"
            file_passed=$((file_passed + 1))
        else
            echo -e "${YELLOW}⚠️  Ordem de CSS incorreta (navbar.css antes de global.css)${NC}"
            file_warnings=$((file_warnings + 1))
        fi
    fi
    
    # Verificação 7: Caminho de navbar.css
    if grep -q "navbar.css" "$file"; then
        local navbar_path=$(grep "navbar.css" "$file" | head -1 | sed 's/.*href="\([^"]*\)".*/\1/')
        
        if [ "$depth" -eq 1 ]; then
            # Subpasta: deve ser ../assets/navbar.css
            if [[ "$navbar_path" == "../assets/navbar.css" ]]; then
                echo -e "${GREEN}✅ Caminho navbar.css correto (../assets/)${NC}"
                file_passed=$((file_passed + 1))
            else
                echo -e "${YELLOW}⚠️  Caminho navbar.css: $navbar_path (esperado: ../assets/)${NC}"
                file_warnings=$((file_warnings + 1))
            fi
        elif [ "$depth" -eq 2 ]; then
            # Subsubpasta: deve ser ../../assets/navbar.css
            if [[ "$navbar_path" == "../../assets/navbar.css" ]]; then
                echo -e "${GREEN}✅ Caminho navbar.css correto (../../assets/)${NC}"
                file_passed=$((file_passed + 1))
            else
                echo -e "${YELLOW}⚠️  Caminho navbar.css: $navbar_path (esperado: ../../assets/)${NC}"
                file_warnings=$((file_warnings + 1))
            fi
        fi
    fi
    
    # Verificação 8: Bootstrap JS Bundle
    if grep -q "bootstrap.bundle.min.js" "$file"; then
        echo -e "${GREEN}✅ Bootstrap JS Bundle${NC}"
        file_passed=$((file_passed + 1))
    else
        if ! grep -q "navbarPlaceholder" "$file"; then
            # OK se for página estática
            echo -e "${YELLOW}⚠️  Bootstrap JS Bundle faltando (pode ser OK para páginas estáticas)${NC}"
        else
            echo -e "${YELLOW}⚠️  Bootstrap JS Bundle faltando${NC}"
            file_warnings=$((file_warnings + 1))
        fi
    fi
    
    # Resultado final do arquivo
    echo ""
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ Arquivo PASSOU${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ Arquivo FALHOU${NC}"
    fi
    
    if [ $file_warnings -gt 0 ]; then
        WARNINGS=$((WARNINGS + file_warnings))
    fi
    
    echo ""
}

# =========================================
# EXECUTAR VALIDAÇÕES
# =========================================

echo ""
echo "🔍 Analisando arquivos HTML..."
echo ""

# Arquivos em public/ (profundidade 0)
echo -e "${BLUE}[1/3] Arquivos em public/${NC}"
check_html_file "public/index.html" 0 || true
echo ""

# Arquivos em public/[subpasta]/ (profundidade 1)
echo -e "${BLUE}[2/3] Arquivos em subpastas (depth=1)${NC}"

check_html_file "public/login/login.html" 1 || true
check_html_file "public/agendamento/agendamento.html" 1 || true
check_html_file "public/consultas/consultas.html" 1 || true
check_html_file "public/consultas/pacientes.html" 1 || true
check_html_file "public/laudo/laudo.html" 1 || true
check_html_file "public/localizacao/localizacao.html" 1 || true
check_html_file "public/profissionais/profissionais.html" 1 || true
check_html_file "public/servicos/servicos.html" 1 || true
check_html_file "public/cadastro/paciente/paciente.html" 2 || true
check_html_file "public/cadastro/medico/medico.html" 2 || true

echo ""
# Arquivos em public/[subpasta]/[subsubpasta]/ (profundidade 2)
echo -e "${BLUE}[3/3] Arquivos em subsubpastas (depth=2)${NC}"

check_html_file "public/perfil/paciente/perfil.html" 2 || true
check_html_file "public/perfil/médico/perfil.html" 2 || true
check_html_file "public/perfil/adm/perfil.html" 2 || true
check_html_file "public/perfil/editar/editar.html" 2 || true

# =========================================
# RESUMO FINAL
# =========================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📊 RESUMO DOS TESTES                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Total de arquivos analisados: $TOTAL"
echo -e "${GREEN}✅ Arquivos que passaram: $PASSED${NC}"
echo -e "${RED}❌ Arquivos que falharam: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo ""

# Calcular percentual
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "Taxa de conformidade: $PERCENTAGE%"
fi

echo ""

# Status final
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS ARQUIVOS PASSARAM!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  ALGUNS ARQUIVOS PRECISAM DE CORREÇÃO${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Leia ANALISE_NAVBAR.md para entender os problemas"
    echo "2. Siga GUIA_PRATICO_CORRECOES.md para corrigir"
    echo "3. Execute este script novamente para validar"
    exit 1
fi
```

---

## 🚀 COMO USAR

### 1. Salvar o script

```bash
cat > VALIDAR_NAVBAR.sh << 'EOF'
[copie o conteúdo do script acima]
EOF
```

### 2. Dar permissão de execução

```bash
chmod +x VALIDAR_NAVBAR.sh
```

### 3. Executar

```bash
./VALIDAR_NAVBAR.sh
```

### 4. Interpretar resultado

```
✅ = Verificação passou
❌ = Erro crítico
⚠️  = Aviso (não crítico)
```

---

## 📝 Scripts Auxiliares

### Script: Procurar Bootstrap faltando

```bash
#!/bin/bash
echo "Procurando arquivos SEM Bootstrap CSS..."
grep -L "bootstrap.*css" public/**/*.html public/*/*.html 2>/dev/null
```

### Script: Procurar caminho errado de navbar.css

```bash
#!/bin/bash
echo "Verificando caminhos de navbar.css..."
for file in public/**/*.html public/*/*.html; do
    if grep -q "navbar.css" "$file" 2>/dev/null; then
        path=$(grep "navbar.css" "$file" | grep -oP 'href="\K[^"]*')
        echo "$file → $path"
    fi
done
```

### Script: Listar ordem de CSS

```bash
#!/bin/bash
echo "Ordem de CSS em cada arquivo..."
for file in public/**/*.html public/*/*.html; do
    if [ -f "$file" ]; then
        echo ""
        echo "📄 $file:"
        grep -n "\.css" "$file" | grep -v "min.css" || echo "  (nenhum)"
    fi
done
```

### Script: Verificar versão de Bootstrap

```bash
#!/bin/bash
echo "Versões de Bootstrap encontradas..."
echo ""
echo "Bootstrap 5.3.0:"
grep -l "@5\.3\.0" public/**/*.html public/*/*.html 2>/dev/null | wc -l
echo ""
echo "Bootstrap 5.3.2:"
grep -l "@5\.3\.2" public/**/*.html public/*/*.html 2>/dev/null | wc -l
```

---

## 🐛 Troubleshooting

### Erro: "permission denied"

```bash
chmod +x VALIDAR_NAVBAR.sh
./VALIDAR_NAVBAR.sh
```

### Erro: "grep: command not found"

Use um computador com Unix/Linux/macOS ou WSL no Windows.

### Erro: "arquivo não encontrado"

Certifique-se de estar no diretório correto:

```bash
cd /home/aluno/Downloads/TCC-Posto-de-Coleta
./VALIDAR_NAVBAR.sh
```

---

## 📊 Esperado vs Obtido

### Antes de Corrigir

```
❌ Total: 16
✅ Passou: 11
❌ Falhou: 1 (pacientes.html)
⚠️  Avisos: 4
Taxa: 69%
```

### Depois de Corrigir

```
✅ Total: 16
✅ Passou: 15
❌ Falhou: 0
⚠️  Avisos: 1 (versionamento Bootstrap)
Taxa: 100%
```

---

