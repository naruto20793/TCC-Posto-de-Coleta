// login/login.js - Sistema completo de autenticação
class LoginSystem {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔐 Sistema de login inicializado');
        this.setupEventListeners();
        this.verificarLoginAutomatico();
        this.preencherDadosDemonstracao();
    }

    setupEventListeners() {
        // Event listeners para os formulários
        document.getElementById('formPaciente')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validarLogin('paciente');
        });

        document.getElementById('formMedico')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validarLogin('medico');
        });

        document.getElementById('formAdm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validarLogin('adm');
        });

        // Event listeners para mudança de abas
        document.querySelectorAll('#loginTabs button').forEach(tab => {
            tab.addEventListener('click', () => {
                this.limparMensagens();
                this.limparCampos();
            });
        });

        // Event listeners para Enter nos campos
        document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const form = e.target.closest('form');
                    if (form) {
                        const tipo = form.id.replace('form', '').toLowerCase();
                        this.validarLogin(tipo);
                    }
                }
            });
        });
    }

    verificarLoginAutomatico() {
        const user = getCurrentUser();
        if (user) {
            console.log('👤 Usuário já logado, redirecionando...');
            this.redirecionarUsuarioLogado(user);
        }
    }

    preencherDadosDemonstracao() {
        // Preencher automaticamente os campos de demonstração
        setTimeout(() => {
            document.getElementById('emailPaciente').value = 'joao@email.com';
            document.getElementById('senhaPaciente').value = '123456';
            
            document.getElementById('emailMedico').value = 'ana.costa@clinica.com';
            document.getElementById('senhaMedico').value = '123456';
            
            document.getElementById('usuarioAdm').value = 'admin';
            document.getElementById('senhaAdm').value = 'admin123';
        }, 1000);
    }

    validarLogin(tipo) {
        console.log(`🔐 Tentativa de login como: ${tipo}`);
        
        this.limparMensagens();
        this.removerEstilosErro();

        let credencial, senha, usuario;
        let valido = true;

        // Obter credenciais baseado no tipo
        switch(tipo) {
            case 'paciente':
                credencial = document.getElementById('emailPaciente').value.trim();
                senha = document.getElementById('senhaPaciente').value.trim();
                usuario = database.findPacienteByEmail(credencial);
                break;

            case 'medico':
                credencial = document.getElementById('emailMedico').value.trim();
                senha = document.getElementById('senhaMedico').value.trim();
                usuario = database.findMedicoByEmail(credencial);
                break;

            case 'adm':
                credencial = document.getElementById('usuarioAdm').value.trim();
                senha = document.getElementById('senhaAdm').value.trim();
                usuario = database.findAdministradorByUsuario(credencial);
                break;
        }

        // Validações básicas
        if (!credencial || !senha) {
            this.mostrarErro('Por favor, preencha todos os campos.');
            valido = false;
        }

        if (!valido) return false;

        // Verificar credenciais
        if (usuario && usuario.senha === senha) {
            if (!usuario.ativo) {
                this.mostrarErro('Esta conta está desativada. Entre em contato com o suporte.');
                return false;
            }

            // Login bem-sucedido
            this.processarLoginSucesso(tipo, usuario);
            return true;
        } else {
            // Login falhou
            this.processarLoginFalha(tipo, credencial);
            return false;
        }
    }

    processarLoginSucesso(tipo, usuario) {
        console.log(`✅ Login bem-sucedido: ${usuario.nome || usuario.usuario}`);

        // Salvar sessão do usuário
        const sessaoUsuario = {
            tipo: tipo,
            dados: usuario,
            dataLogin: new Date().toISOString(),
            sessionId: this.gerarSessionId()
        };

        localStorage.setItem('usuarioLogado', JSON.stringify(sessaoUsuario));

        // Atualizar último acesso
        this.atualizarUltimoAcesso(tipo, usuario.id);

        // Mostrar mensagem de sucesso
        this.mostrarSucesso(`Bem-vindo, ${usuario.nome || usuario.usuario}!`);

        // Adicionar efeito visual de sucesso
        this.adicionarEfeitoSucesso();

        // Redirecionar após delay
        setTimeout(() => {
            this.redirecionarPosLogin(tipo);
        }, 1500);
    }

    processarLoginFalha(tipo, credencial) {
        console.log(`❌ Login falhou para: ${credencial}`);

        // Mostrar erro
        this.mostrarErro('Credenciais inválidas. Verifique seu email/usuário e senha.');

        // Adicionar estilos de erro
        this.adicionarEstilosErro(tipo);

        // Registrar tentativa falha (para futura implementação de bloqueio)
        this.registrarTentativaFalha(credencial);

        // Efeito visual de erro
        this.adicionarEfeitoErro();
    }

    redirecionarPosLogin(tipo) {
        const redirecionamentos = {
            'paciente': '../agendamento/agendamento.html',
            'medico': '../profissionais/profissionais.html',
            'adm': '../index.html'
        };

        window.location.href = redirecionamentos[tipo] || '../index.html';
    }

    redirecionarUsuarioLogado(user) {
        const redirecionamentos = {
            'paciente': '../agendamento/agendamento.html',
            'medico': '../profissionais/profissionais.html', 
            'adm': '../index.html'
        };

        const destino = redirecionamentos[user.tipo] || '../index.html';
        
        // Mostrar mensagem e redirecionar
        this.mostrarInfo(`Você já está logado como ${user.dados.nome}. Redirecionando...`);
        
        setTimeout(() => {
            window.location.href = destino;
        }, 2000);
    }

    // Métodos de UI
    mostrarErro(mensagem) {
        const elementoErro = document.getElementById('mensagemErro');
        const textoErro = document.getElementById('textoErro');
        
        if (elementoErro && textoErro) {
            textoErro.textContent = mensagem;
            elementoErro.style.display = 'block';
            elementoErro.classList.add('fade-in');
        }

        // Também mostrar notificação se disponível
        if (typeof notificacao !== 'undefined') {
            notificacao.erro(mensagem);
        }
    }

    mostrarSucesso(mensagem) {
        const elementoSucesso = document.getElementById('mensagemSucesso');
        const textoSucesso = document.getElementById('textoSucesso');
        
        if (elementoSucesso && textoSucesso) {
            textoSucesso.textContent = mensagem;
            elementoSucesso.style.display = 'block';
            elementoSucesso.classList.add('fade-in');
        }
    }

    mostrarInfo(mensagem) {
        // Criar alerta informativo temporário
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-info text-center mt-3 fade-in';
        alerta.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            ${mensagem}
        `;

        const container = document.querySelector('.card-body');
        container.insertBefore(alerta, container.firstChild);

        setTimeout(() => {
            alerta.remove();
        }, 3000);
    }

    limparMensagens() {
        const mensagens = document.querySelectorAll('#mensagemErro, #mensagemSucesso');
        mensagens.forEach(msg => {
            msg.style.display = 'none';
            msg.classList.remove('fade-in');
        });
    }

    limparCampos() {
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
            input.classList.remove('campo-invalido');
        });
    }

    adicionarEstilosErro(tipo) {
        const elementos = {
            'paciente': ['emailPaciente', 'senhaPaciente'],
            'medico': ['emailMedico', 'senhaMedico'], 
            'adm': ['usuarioAdm', 'senhaAdm']
        };

        elementos[tipo]?.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.classList.add('campo-invalido');
            }
        });
    }

    removerEstilosErro() {
        document.querySelectorAll('.campo-invalido').forEach(el => {
            el.classList.remove('campo-invalido');
        });
    }

    adicionarEfeitoSucesso() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'pulse 0.5s ease-in-out';
            }, 10);
        }
    }

    adicionarEfeitoErro() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'shake 0.5s ease-in-out';
            }, 10);
        }
    }

    // Métodos utilitários
    gerarSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    atualizarUltimoAcesso(tipo, usuarioId) {
        // Em uma implementação real, isso seria salvo no servidor
        console.log(`📝 Atualizando último acesso para ${tipo} ID: ${usuarioId}`);
        
        // Para demonstração, vamos atualizar no localStorage
        try {
            if (tipo === 'paciente') {
                database.updatePaciente(usuarioId, {
                    ultimoAcesso: new Date().toISOString()
                });
            } else if (tipo === 'medico') {
                database.updateMedico(usuarioId, {
                    ultimoAcesso: new Date().toISOString()
                });
            }
        } catch (error) {
            console.warn('Não foi possível atualizar último acesso:', error);
        }
    }

    registrarTentativaFalha(credencial) {
        // Em uma implementação real, isso seria enviado para o servidor
        // para prevenção de ataques de força bruta
        console.log(`🚫 Tentativa de login falha para: ${credencial}`);
    }

    esqueciSenha(tipo) {
        const modais = {
            'paciente': 'paciente',
            'medico': 'médico'
        };

        const modalHTML = `
            <div class="modal fade" id="esqueciSenhaModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-key me-2"></i>Recuperar Senha
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Para redefinir sua senha de ${modais[tipo] || 'usuário'}, entre em contato com nossa central:</p>
                            <div class="text-center">
                                <h5><i class="fas fa-phone me-2"></i>(48) 3524-1234</h5>
                                <p class="text-muted">Ou visite nossa unidade presencialmente</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <a href="tel:+554835241234" class="btn btn-primary">
                                <i class="fas fa-phone me-2"></i>Ligar Agora
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mostrar modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('esqueciSenhaModal'));
        modal.show();

        // Limpar após fechar
        document.getElementById('esqueciSenhaModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // Método para logout (útil para testes)
    logout() {
        localStorage.removeItem('usuarioLogado');
        this.mostrarSucesso('Logout realizado com sucesso!');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Inicializar sistema de login
const loginSystem = new LoginSystem();

// Funções globais para compatibilidade
window.validarLogin = function(tipo) {
    return loginSystem.validarLogin(tipo);
};

window.esqueciSenha = function(tipo) {
    loginSystem.esqueciSenha(tipo);
};

// Adicionar animações CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema de login carregado com sucesso');