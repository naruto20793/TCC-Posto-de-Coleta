// assets/auth.js - Gerenciador de Autenticação Simples

/**
 * Sistema simples de autenticação
 * Em produção, usar JWT com backend
 */

class AuthManager {
    constructor() {
        this.STORAGE_KEY = 'usuarioAtual';
        this.usuarioAtual = this.recuperarUsuario();
    }

    /**
     * Recuperar usuário armazenado
     */
    recuperarUsuario() {
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('Erro ao recuperar usuário:', error);
            return null;
        }
    }

    /**
     * Fazer login
     * @param {string} usuario - Username ou email
     * @param {string} senha - Senha
     * @param {string} tipo - 'admin', 'medico', 'paciente'
     */
    login(usuario, senha, tipo = 'paciente') {
        // Validação básica
        if (!usuario || !senha) {
            console.error('Usuário e senha são obrigatórios');
            return false;
        }

        // Criar objeto de usuário
        const usuarioObj = {
            id: Date.now().toString(),
            usuario: usuario,
            tipo: tipo, // admin, medico, paciente
            nome: usuario.split('@')[0], // Nome derivado do usuário
            loginEm: new Date().toISOString(),
            ativo: true
        };

        // Armazenar
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuarioObj));
        this.usuarioAtual = usuarioObj;

        return true;
    }

    /**
     * Fazer logout
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.usuarioAtual = null;
        window.location.href = '/login/login.html';
    }

    /**
     * Verificar se usuário está autenticado
     */
    estaAutenticado() {
        return this.usuarioAtual !== null;
    }

    /**
     * Verificar se usuário tem permissão
     * @param {string|string[]} tiposPermitidos - Tipo(s) permitido(s)
     */
    temPermissao(tiposPermitidos) {
        if (!this.estaAutenticado()) return false;

        if (typeof tiposPermitidos === 'string') {
            return this.usuarioAtual.tipo === tiposPermitidos;
        }

        return tiposPermitidos.includes(this.usuarioAtual.tipo);
    }

    /**
     * Obter tipo do usuário
     */
    obterTipo() {
        return this.usuarioAtual?.tipo || null;
    }

    /**
     * Obter nome do usuário
     */
    obterNome() {
        return this.usuarioAtual?.nome || 'Visitante';
    }

    /**
     * Obter ID do usuário
     */
    obterId() {
        return this.usuarioAtual?.id || null;
    }

    /**
     * Obter dados completos do usuário
     */
    obterUsuario() {
        return this.usuarioAtual;
    }
}

// Instância global
const auth = new AuthManager();

/**
 * Proteger página - redireciona se não tiver permissão
 * @param {string|string[]} tiposPermitidos - Tipo(s) de usuário permitido(s)
 * @param {string} urlRedirecionamento - URL para redirecionar (padrão: login)
 */
function protegerPagina(tiposPermitidos, urlRedirecionamento = '/login/login.html') {
    if (!auth.temPermissao(tiposPermitidos)) {
        console.warn('Acesso negado. Redirecionando para login...');
        window.location.href = urlRedirecionamento;
    }
}

/**
 * Definir usuário manualmente (para testes)
 * @param {string} tipo - admin, medico ou paciente
 */
function definirUsuarioTeste(tipo = 'admin') {
    const usuarios = {
        admin: {
            id: '1',
            usuario: 'admin',
            tipo: 'admin',
            nome: 'Administrador',
            loginEm: new Date().toISOString(),
            ativo: true
        },
        medico: {
            id: '2',
            usuario: 'medico',
            tipo: 'medico',
            nome: 'Dr. Carlos',
            crm: '12345/SC',
            loginEm: new Date().toISOString(),
            ativo: true
        },
        paciente: {
            id: '3',
            usuario: 'paciente',
            tipo: 'paciente',
            nome: 'João Silva',
            cpf: '123.456.789-00',
            loginEm: new Date().toISOString(),
            ativo: true
        }
    };

    const usuario = usuarios[tipo] || usuarios.paciente;
    localStorage.setItem('usuarioAtual', JSON.stringify(usuario));
    auth.usuarioAtual = usuario;
    
    console.log(`✅ Usuário teste (${tipo}) definido no localStorage`);
}
