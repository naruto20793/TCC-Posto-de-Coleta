// servicos/servicos.js - Sistema completo de serviços
class ServicosSystem {
    constructor() {
        this.servicos = [];
        this.categoriaAtiva = 'todos';
        this.init();
    }

    init() {
        console.log('🏥 Sistema de serviços inicializado');
        this.carregarServicos();
        this.configurarEventListeners();
        this.configurarFiltros();
    }

    carregarServicos() {
        this.servicos = database.getServicosAtivos();
        this.renderizarServicos();
    }

    configurarEventListeners() {
        // Event listeners para filtros
        document.querySelectorAll('#filtrosCategoria .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.atualizarFiltroAtivo(e.target);
            });
        });

        // Event listener para busca (se houver)
        const buscaInput = document.getElementById('buscaServicos');
        if (buscaInput) {
            buscaInput.addEventListener('input', (e) => {
                this.filtrarServicos(e.target.value);
            });
        }
    }

    configurarFiltros() {
        // Adicionar serviços de emergência manualmente
        this.adicionarServicosEmergencia();
    }

    adicionarServicosEmergencia() {
        const servicosEmergencia = [
            {
                id: 1001,
                nome: 'Pronto Atendimento 24h',
                descricao: 'Atendimento médico de urgência e emergência 24 horas por dia',
                duracao: 0,
                valor: 0,
                categoria: 'emergencia',
                ativo: true,
                icone: 'fa-ambulance'
            },
            {
                id: 1002,
                nome: 'Observação Clínica',
                descricao: 'Acompanhamento médico contínuo por até 24 horas',
                duracao: 1440,
                valor: 0,
                categoria: 'emergencia',
                ativo: true,
                icone: 'fa-procedures'
            },
            {
                id: 1003,
                nome: 'Suturas e Curativos',
                descricao: 'Atendimento para ferimentos e traumas',
                duracao: 30,
                valor: 0,
                categoria: 'emergencia',
                ativo: true,
                icone: 'fa-band-aid'
            }
        ];

        // Adicionar apenas se não existirem
        servicosEmergencia.forEach(servico => {
            if (!this.servicos.find(s => s.id === servico.id)) {
                this.servicos.push(servico);
            }
        });
    }

    atualizarFiltroAtivo(botaoClicado) {
        // Remover classe active de todos os botões
        document.querySelectorAll('#filtrosCategoria .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Adicionar classe active ao botão clicado
        botaoClicado.classList.add('active');

        // Atualizar categoria ativa
        this.categoriaAtiva = botaoClicado.getAttribute('data-categoria');

        // Renderizar serviços filtrados
        this.renderizarServicos();
    }

    filtrarServicos(termoBusca) {
        const servicosFiltrados = this.servicos.filter(servico => {
            const busca = termoBusca.toLowerCase();
            return servico.nome.toLowerCase().includes(busca) ||
                   servico.descricao.toLowerCase().includes(busca) ||
                   servico.categoria.toLowerCase().includes(busca);
        });

        this.renderizarServicos(servicosFiltrados);
    }

    renderizarServicos(servicos = null) {
        const grid = document.getElementById('gridServicos');
        const servicosParaRenderizar = servicos || this.filtrarPorCategoria(this.servicos);

        if (servicosParaRenderizar.length === 0) {
            grid.innerHTML = this.criarMensagemSemServicos();
            return;
        }

        grid.innerHTML = servicosParaRenderizar.map(servico => 
            this.criarCardServico(servico)
        ).join('');
    }

    filtrarPorCategoria(servicos) {
        if (this.categoriaAtiva === 'todos') {
            return servicos;
        }
        return servicos.filter(servico => servico.categoria === this.categoriaAtiva);
    }

    criarCardServico(servico) {
        const icone = servico.icone || this.getIconePorCategoria(servico.categoria);
        const badgeClass = `badge-${servico.categoria}`;
        const valorFormatado = servico.valor > 0 ? `R$ ${servico.valor.toFixed(2)}` : 'Sob Consulta';
        const duracaoTexto = servico.duracao > 0 ? `${servico.duracao} min` : 'Variável';

        return `
            <div class="servico-card card h-100" data-servico-id="${servico.id}">
                <div class="card-body position-relative">
                    <span class="badge ${badgeClass} badge-categoria">${this.formatarCategoria(servico.categoria)}</span>
                    
                    <div class="servico-icon">
                        <i class="fas ${icone}"></i>
                    </div>
                    
                    <h5 class="card-title">${servico.nome}</h5>
                    <p class="card-text">${servico.descricao}</p>
                    
                    <div class="servico-info mt-4">
                        <div class="servico-preco">${valorFormatado}</div>
                        <div class="servico-duracao">
                            <i class="fas fa-clock me-1"></i>${duracaoTexto}
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2 mt-3">
                        ${this.criarBotaoAcao(servico)}
                        <button class="btn btn-outline-primary" onclick="servicosSystem.mostrarDetalhesServico(${servico.id})">
                            <i class="fas fa-info-circle me-1"></i>Mais Informações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getIconePorCategoria(categoria) {
        const icones = {
            'consultas': 'fa-stethoscope',
            'exames': 'fa-vial',
            'procedimentos': 'fa-procedures',
            'emergencia': 'fa-ambulance'
        };
        return icones[categoria] || 'fa-heartbeat';
    }

    formatarCategoria(categoria) {
        const categorias = {
            'consultas': 'Consulta',
            'exames': 'Exame',
            'procedimentos': 'Procedimento',
            'emergencia': 'Emergência'
        };
        return categorias[categoria] || categoria;
    }

    criarBotaoAcao(servico) {
        if (servico.categoria === 'emergencia') {
            return `
                <button class="btn btn-danger" onclick="servicosSystem.acionarEmergencia()">
                    <i class="fas fa-phone me-1"></i>Ligar Emergência
                </button>
            `;
        } else {
            const user = getCurrentUser();
            if (user && user.tipo === 'paciente') {
                return `
                    <button class="btn btn-agendar" onclick="servicosSystem.agendarServico(${servico.id})">
                        <i class="fas fa-calendar-plus me-1"></i>Agendar
                    </button>
                `;
            } else {
                return `
                    <button class="btn btn-primary" onclick="servicosSystem.solicitarAgendamento(${servico.id})">
                        <i class="fas fa-info-circle me-1"></i>Saber Mais
                    </button>
                `;
            }
        }
    }

    criarMensagemSemServicos() {
        return `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">Nenhum serviço encontrado</h4>
                <p class="text-muted">Tente alterar os filtros ou buscar por outro termo.</p>
                <button class="btn btn-primary" onclick="servicosSystem.limparFiltros()">
                    <i class="fas fa-times me-1"></i>Limpar Filtros
                </button>
            </div>
        `;
    }

    agendarServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        const user = getCurrentUser();

        if (!user) {
            this.mostrarModalLogin();
            return;
        }

        if (!servico) {
            this.mostrarErro('Serviço não encontrado.');
            return;
        }

        // Redirecionar para agendamento com parâmetros
        window.location.href = `../agendamento/agendamento.html?servico=${servicoId}`;
    }

    solicitarAgendamento(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        
        if (!servico) {
            this.mostrarErro('Serviço não encontrado.');
            return;
        }

        this.mostrarModalInformacoes(servico);
    }

    acionarEmergencia() {
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
                        <div class="modal-body text-center">
                            <div class="alert alert-danger">
                                <h6><i class="fas fa-exclamation-triangle me-2"></i>Emergência Médica</h6>
                                <p class="mb-2">Se esta é uma situação de emergência, ligue imediatamente:</p>
                                <h3 class="text-danger my-3">
                                    <i class="fas fa-phone me-2"></i>(48) 3524-9999
                                </h3>
                            </div>
                            
                            <div class="row text-center mt-4">
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
                            
                            <div class="mt-4">
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

        this.mostrarModal(modalHTML, 'modalEmergencia');
    }

    mostrarDetalhesServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        
        if (!servico) {
            this.mostrarErro('Serviço não encontrado.');
            return;
        }

        const modalHTML = `
            <div class="modal fade servico-modal" id="detalhesServico" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas ${this.getIconePorCategoria(servico.categoria)} me-2"></i>
                                ${servico.nome}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="servico-info">
                                <div class="servico-info-icon">
                                    <i class="fas ${this.getIconePorCategoria(servico.categoria)}"></i>
                                </div>
                                <div>
                                    <h6 class="text-primary">Descrição do Serviço</h6>
                                    <p class="mb-0">${servico.descricao}</p>
                                </div>
                            </div>
                            
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h6 class="card-title">
                                                <i class="fas fa-clock me-1"></i>Duração
                                            </h6>
                                            <p class="card-text mb-0">${servico.duracao > 0 ? `${servico.duracao} minutos` : 'Variável'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h6 class="card-title">
                                                <i class="fas fa-dollar-sign me-1"></i>Valor
                                            </h6>
                                            <p class="card-text mb-0">${servico.valor > 0 ? `R$ ${servico.valor.toFixed(2)}` : 'Sob Consulta'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6 class="alert-heading">
                                        <i class="fas fa-info-circle me-2"></i>Informações Importantes
                                </h6>
                                <p class="mb-2">Para agendar este serviço, é necessário:</p>
                                <ul class="mb-0">
                                    <li>Cadastro completo no sistema</li>
                                    <li>Documentos pessoais atualizados</li>
                                    <li>Cartão do SUS ou convênio médico (se aplicável)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            ${this.criarBotaoAcaoModal(servico)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.mostrarModal(modalHTML, 'detalhesServico');
    }

    criarBotaoAcaoModal(servico) {
        if (servico.categoria === 'emergencia') {
            return `
                <button class="btn btn-danger" onclick="servicosSystem.acionarEmergencia()">
                    <i class="fas fa-phone me-1"></i>Ligar Emergência
                </button>
            `;
        } else {
            const user = getCurrentUser();
            if (user && user.tipo === 'paciente') {
                return `
                    <button class="btn btn-primary" onclick="servicosSystem.agendarServico(${servico.id})">
                        <i class="fas fa-calendar-plus me-1"></i>Agendar Agora
                    </button>
                `;
            } else {
                return `
                    <button class="btn btn-outline-primary" onclick="authSystem.mostrarModalLogin()">
                        <i class="fas fa-sign-in-alt me-1"></i>Fazer Login para Agendar
                    </button>
                `;
            }
        }
    }

    mostrarModalInformacoes(servico) {
        const modalHTML = `
            <div class="modal fade" id="modalInformacoes" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas ${this.getIconePorCategoria(servico.categoria)} me-2"></i>
                                ${servico.nome}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${servico.descricao}</p>
                            
                            <div class="alert alert-warning">
                                <h6 class="alert-heading">
                                    <i class="fas fa-exclamation-triangle me-2"></i>Atenção
                                </h6>
                                <p class="mb-0">Para agendar este serviço é necessário fazer login como paciente.</p>
                            </div>
                            
                            <div class="servico-detalhes mt-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span><strong>Duração:</strong></span>
                                    <span>${servico.duracao > 0 ? `${servico.duracao} minutos` : 'Variável'}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span><strong>Valor:</strong></span>
                                    <span>${servico.valor > 0 ? `R$ ${servico.valor.toFixed(2)}` : 'Sob Consulta'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" onclick="authSystem.mostrarModalLogin()">
                                <i class="fas fa-sign-in-alt me-1"></i>Fazer Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.mostrarModal(modalHTML, 'modalInformacoes');
    }

    mostrarModal(html, modalId) {
        // Remover modal existente se houver
        const modalExistente = document.getElementById(modalId);
        if (modalExistente) {
            modalExistente.remove();
        }

        // Adicionar novo modal ao body
        document.body.insertAdjacentHTML('beforeend', html);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        // Remover modal do DOM quando fechar
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    mostrarModalLogin() {
        if (typeof authSystem !== 'undefined') {
            authSystem.mostrarModalLogin();
        } else {
            this.mostrarErro('Sistema de autenticação não disponível.');
        }
    }

    mostrarErro(mensagem) {
        // Implementar toast ou alerta de erro
        console.error('Erro:', mensagem);
        
        // Exemplo simples com alert
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: mensagem,
                timer: 3000
            });
        } else {
            alert(mensagem);
        }
    }

    limparFiltros() {
        // Resetar categoria ativa
        this.categoriaAtiva = 'todos';
        
        // Resetar botões de filtro
        document.querySelectorAll('#filtrosCategoria .btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-categoria') === 'todos') {
                btn.classList.add('active');
            }
        });

        // Limpar busca
        const buscaInput = document.getElementById('buscaServicos');
        if (buscaInput) {
            buscaInput.value = '';
        }

        // Renderizar todos os serviços
        this.renderizarServicos();
    }

    // Método para atualizar serviços quando usuário faz login/logout
    atualizarInterfaceUsuario() {
        this.renderizarServicos();
    }

    // Método para buscar serviço por ID
    getServicoPorId(servicoId) {
        return this.servicos.find(servico => servico.id === servicoId);
    }

    // Método para obter serviços por categoria
    getServicosPorCategoria(categoria) {
        return this.servicos.filter(servico => servico.categoria === categoria);
    }

    // Método para obter estatísticas dos serviços
    getEstatisticasServicos() {
        const estatisticas = {
            total: this.servicos.length,
            porCategoria: {}
        };

        this.servicos.forEach(servico => {
            if (!estatisticas.porCategoria[servico.categoria]) {
                estatisticas.porCategoria[servico.categoria] = 0;
            }
            estatisticas.porCategoria[servico.categoria]++;
        });

        return estatisticas;
    }

    // Método para exportar serviços (para administradores)
    exportarServicos() {
        const estatisticas = this.getEstatisticasServicos();
        
        console.log('📊 Estatísticas dos Serviços:');
        console.log(`Total de serviços: ${estatisticas.total}`);
        console.log('Serviços por categoria:');
        Object.entries(estatisticas.porCategoria).forEach(([categoria, quantidade]) => {
            console.log(`- ${this.formatarCategoria(categoria)}: ${quantidade}`);
        });
        
        return estatisticas;
    }
}

// Inicializar sistema quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.servicosSystem = new ServicosSystem();
});

// Funções globais para acesso externo
function getServicosDisponiveis() {
    return window.servicosSystem ? window.servicosSystem.servicos : [];
}

function filtrarServicosPorCategoria(categoria) {
    if (window.servicosSystem) {
        window.servicosSystem.categoriaAtiva = categoria;
        window.servicosSystem.renderizarServicos();
    }
}

function buscarServicos(termo) {
    if (window.servicosSystem) {
        window.servicosSystem.filtrarServicos(termo);
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicosSystem;
}