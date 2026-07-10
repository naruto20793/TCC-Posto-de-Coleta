// script.js - Sistema principal da página inicial
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Posto de Coleta Araranguá - Sistema iniciado com sucesso');
    
    inicializarSistema();
    configurarEventListeners();
    carregarDadosIniciais();
});

function inicializarSistema() {
    // Verificar autenticação do usuário
    const user = getCurrentUser();
    const welcomeBanner = document.getElementById('welcomeBanner');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const quickAppointment = document.getElementById('quickAppointment');
    const cadastroPacienteCard = document.getElementById('cadastroPacienteCard');
    const cadastroMedicoCard = document.getElementById('cadastroMedicoCard');

    if (user) {
        // Usuário logado - personalizar experiência
        const userName = user.dados.nome || user.dados.usuario || 'Usuário';
        const userType = user.tipo;
        
        welcomeBanner.style.display = 'block';
        welcomeMessage.textContent = `Bem-vindo de volta, ${userName}!`;
        
        // Mensagem personalizada por tipo de usuário
        const subtitles = {
            'paciente': 'Agradecemos sua confiança em nossos serviços',
            'medico': 'Bom trabalho hoje, Doutor(a)!',
            'adm': 'Painel administrativo disponível'
        };
        welcomeSubtitle.textContent = subtitles[userType] || 'Estamos felizes em tê-lo conosco';

        // Mostrar agendamento rápido apenas para pacientes
        if (userType === 'paciente') {
            quickAppointment.style.display = 'block';
        }

        // Ajustar cards de cadastro baseado no tipo de usuário
        ajustarCardsCadastro(userType, cadastroPacienteCard, cadastroMedicoCard);
    } else {
        // Usuário não logado - experiência padrão
        welcomeBanner.style.display = 'none';
        quickAppointment.style.display = 'none';
    }

    // Aplicar animações nos cards
    aplicarAnimacoes();
}

function ajustarCardsCadastro(userType, pacienteCard, medicoCard) {
    const textos = {
        paciente: {
            titulo: '👤 Meu Cadastro',
            descricao: 'Gerencie suas informações pessoais e preferências',
            badges: ['Editar Perfil', 'Histórico', 'Preferências']
        },
        medico: {
            titulo: '👨‍⚕️ Meu Perfil',
            descricao: 'Atualize seu perfil profissional e disponibilidade',
            badges: ['Perfil Profissional', 'Agenda', 'Especialidades']
        },
        adm: {
            titulo: '⚙️ Painel Admin',
            descricao: 'Acesse o painel de administração do sistema',
            badges: ['Gestão', 'Relatórios', 'Configurações']
        }
    };

    const config = textos[userType];
    
    if (config) {
        if (userType === 'paciente') {
            pacienteCard.querySelector('.card-title').textContent = config.titulo;
            pacienteCard.querySelector('.card-text').textContent = config.descricao;
            pacienteCard.href = 'cadastro/paciente/paciente.html?edit=true';
            medicoCard.style.display = 'none';
            
            // Atualizar badges
            const badgeContainer = pacienteCard.querySelector('.mt-3');
            badgeContainer.innerHTML = config.badges.map(badge => 
                `<span class="badge bg-primary">${badge}</span>`
            ).join('');
            
        } else if (userType === 'medico') {
            medicoCard.querySelector('.card-title').textContent = config.titulo;
            medicoCard.querySelector('.card-text').textContent = config.descricao;
            medicoCard.href = 'cadastro/medico/medico.html?edit=true';
            pacienteCard.style.display = 'none';
            
            // Atualizar badges
            const badgeContainer = medicoCard.querySelector('.mt-3');
            badgeContainer.innerHTML = config.badges.map(badge => 
                `<span class="badge bg-primary">${badge}</span>`
            ).join('');
            
        } else if (userType === 'adm') {
            pacienteCard.style.display = 'none';
            medicoCard.style.display = 'none';
        }
    }
}

function configurarEventListeners() {
    // Configurar tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Event listeners para cards de menu
    document.querySelectorAll('.card-menu').forEach(card => {
        card.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#emergencia') {
                e.preventDefault();
                abrirModalEmergencia();
            }
        });
    });

    // Event listener para FAQ
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Configurar observador de interseção para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    document.querySelectorAll('.card, .stat-card, .highlight-item').forEach(el => {
        observer.observe(el);
    });
}

function aplicarAnimacoes() {
    // Aplicar delays escalonados para animações
    document.querySelectorAll('.card-menu').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });

    document.querySelectorAll('.stat-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
        card.classList.add('slide-in-up');
    });

    document.querySelectorAll('.highlight-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
        item.classList.add('fade-in');
    });
}

function carregarDadosIniciais() {
    // Carregar dados de exemplo se necessário
    if (typeof database !== 'undefined') {
        database.carregarDadosExemplo();
    }

    // Atualizar contadores em tempo real (simulação)
    atualizarContadores();
    
    // Carregar informações dinâmicas
    carregarInformacoesDinamicas();
}

function atualizarContadores() {
    // Simular atualização de contadores em tempo real
    const counters = document.querySelectorAll('.stat-card h3');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const increment = target / 100;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current) + '+';
        }, 20);
    });
}

function carregarInformacoesDinamicas() {
    // Carregar informações que podem mudar dinamicamente
    const agora = new Date();
    const hora = agora.getHours();
    
    // Mensagem de saudação baseada no horário
    let saudacao = '';
    if (hora < 12) saudacao = 'Bom dia';
    else if (hora < 18) saudacao = 'Boa tarde';
    else saudacao = 'Boa noite';
    
    // Atualizar SEO dinâmico
    document.title = `Posto de Coleta Araranguá - ${saudacao}`;
    
    // Verificar status de funcionamento
    verificarStatusFuncionamento();
}

function verificarStatusFuncionamento() {
    const agora = new Date();
    const hora = agora.getHours();
    const diaSemana = agora.getDay(); // 0 = Domingo, 6 = Sábado
    
    const estaAberto = (
        (diaSemana >= 1 && diaSemana <= 5 && hora >= 7 && hora < 18) || // Seg-Sex 7h-18h
        (diaSemana === 6 && hora >= 7 && hora < 12) // Sábado 7h-12h
    );
    
    if (!estaAberto) {
        mostrarIndicadorForaExpediente();
    }
}

function mostrarIndicadorForaExpediente() {
    const indicator = document.createElement('div');
    indicator.className = 'alert alert-warning text-center mb-0 rounded-0';
    indicator.innerHTML = `
        <i class="fas fa-clock me-2"></i>
        <strong>Fora do expediente:</strong> Estamos fechados no momento. 
        <a href="#emergencia" class="alert-link">Emergência 24h disponível</a>
    `;
    
    document.body.insertBefore(indicator, document.body.firstChild);
}

function abrirModalEmergencia() {
    // Criar modal de emergência dinâmico
    const modalHTML = `
        <div class="modal fade" id="modalEmergencia" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-ambulance me-2"></i>Atendimento de Emergência
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <h6><i class="fas fa-exclamation-triangle me-2"></i>Emergência Médica</h6>
                            <p class="mb-2">Se esta é uma situação de emergência, ligue imediatamente:</p>
                            <h4 class="text-center my-3">
                                <i class="fas fa-phone me-2"></i>(48) 3524-9999
                            </h4>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="p-3 border rounded">
                                    <i class="fas fa-ambulance fa-2x text-danger mb-2"></i>
                                    <h6>Ambulância</h6>
                                    <small>192</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-3 border rounded">
                                    <i class="fas fa-fire-extinguisher fa-2x text-danger mb-2"></i>
                                    <h6>Bombeiros</h6>
                                    <small>193</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <h6>Endereço para Emergência:</h6>
                            <p class="mb-1">Rua Petronilha Jamic, 160 - Centro</p>
                            <p class="mb-0">Araranguá - SC</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <a href="tel:+554835249999" class="btn btn-danger">
                            <i class="fas fa-phone me-2"></i>Ligar Agora
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalEmergencia'));
    modal.show();
    
    // Limpar modal após fechar
    document.getElementById('modalEmergencia').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Funções de utilidade global
function formatarTelefone(telefone) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarHora(hora) {
    return hora.substring(0, 5);
}

// Sistema de notificações
class NotificacaoSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.criarContainer();
    }

    criarContainer() {
        this.container = document.createElement('div');
        this.container.className = 'position-fixed top-0 end-0 p-3';
        this.container.style.zIndex = '9999';
        document.body.appendChild(this.container);
    }

    mostrar(mensagem, tipo = 'info', duracao = 5000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show`;
        alert.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.container.appendChild(alert);

        // Auto-remover após duração
        if (duracao > 0) {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, duracao);
        }

        return alert;
    }

    sucesso(mensagem, duracao = 5000) {
        return this.mostrar(mensagem, 'success', duracao);
    }

    erro(mensagem, duracao = 5000) {
        return this.mostrar(mensagem, 'danger', duracao);
    }

    aviso(mensagem, duracao = 5000) {
        return this.mostrar(mensagem, 'warning', duracao);
    }

    info(mensagem, duracao = 5000) {
        return this.mostrar(mensagem, 'info', duracao);
    }
}

// Inicializar sistema de notificações
const notificacao = new NotificacaoSystem();

// Exportar funções globais
window.formatarTelefone = formatarTelefone;
window.formatarCPF = formatarCPF;
window.formatarData = formatarData;
window.formatarHora = formatarHora;
window.notificacao = notificacao;

// Service Worker para PWA (futura implementação)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado com sucesso: ', registration.scope);
            })
            .catch(function(error) {
                console.log('Falha no registro do ServiceWorker: ', error);
            });
    });
}

// Monitorar performance
window.addEventListener('load', function() {
    const loadTime = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    console.log(`Página carregada em ${loadTime}ms`);
    
    if (loadTime > 3000) {
        console.warn('Tempo de carregamento alto, considere otimizações');
    }
});

// Tratamento de erros global
window.addEventListener('error', function(e) {
    console.error('Erro capturado:', e.error);
    notificacao.erro('Ocorreu um erro inesperado. Por favor, recarregue a página.');
});

// Offline detection
window.addEventListener('online', function() {
    notificacao.sucesso('Conexão restabelecida', 3000);
});

window.addEventListener('offline', function() {
    notificacao.aviso('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 5000);
});