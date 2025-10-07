// laudo/laudo.js - Script para visualização de laudos e resumos
class ResultadosSystem {
    constructor() {
        this.pacienteId = null;
        this.laudoFiltrado = [];
        this.consultaFiltrada = [];
        this.dataFiltro = '';
        this.init();
    }

    init() {
        console.log('📋 Sistema de resultados iniciado');
        
        // Verificar autenticação
        const user = getCurrentUser();
        if (!user || user.tipo !== 'paciente') {
            alert('Acesso restrito a pacientes. Faça login.');
            window.location.href = '../../login/login.html';
            return;
        }
        this.pacienteId = user.dados.id;
        
        this.carregarResultados();
        this.configurarEventListeners();
        this.popularFiltrosData();
    }

    configurarEventListeners() {
        // Filtro por data
        document.getElementById('filtroData').addEventListener('change', (e) => {
            this.dataFiltro = e.target.value;
            this.filtrarResultados();
        });

        // Tabs
        document.querySelectorAll('#resultadosTabs .nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                this.renderizarResultados();
            });
        });
    }

    carregarResultados() {
        // Carrega do database (simula se vazio)
        this.laudoFiltrado = database.getLaudos(this.pacienteId) || [
            { id: 1, data: '2025-10-01', exame: 'Hemograma', status: 'normal', resumo: 'Exame dentro dos limites normais.', anexo: 'hemograma.pdf' },
            { id: 2, data: '2025-09-15', exame: 'Raio-X Tórax', status: 'anormal', resumo: 'Alterações leves observadas. Recomenda-se acompanhamento.', anexo: 'raio-x.pdf' }
        ];
        
        this.consultaFiltrada = database.getResumosConsultas(this.pacienteId) || [
            { id: 1, data: '2025-10-05', especialidade: 'Clínica Geral', medico: 'Dr. João Silva', resumo: 'Consulta de rotina. Paciente estável.', recomendacoes: 'Manter dieta equilibrada.', duracao: 30 },
            { id: 2, data: '2025-09-20', especialidade: 'Cardiologia', medico: 'Dra. Ana Costa', resumo: 'Avaliação cardiológica normal.', recomendacoes: 'Exercícios leves 3x/semana.', duracao: 45 }
        ];
        
        this.renderizarResultados();
    }

    popularFiltrosData() {
        const datasUnicas = [...new Set([...this.laudoFiltrado, ...this.consultaFiltrada].map(item => item.data))].sort().reverse();
        const select = document.getElementById('filtroData');
        datasUnicas.forEach(data => {
            const option = document.createElement('option');
            option.value = data;
            option.textContent = new Date(data).toLocaleDateString('pt-BR');
            select.appendChild(option);
        });
    }

    filtrarResultados() {
        if (this.dataFiltro) {
            this.laudoFiltrado = this.laudoFiltrado.filter(l => l.data === this.dataFiltro);
            this.consultaFiltrada = this.consultaFiltrada.filter(r => r.data === this.dataFiltro);
        } else {
            this.carregarResultados(); // Reset
        }
        this.renderizarResultados();
    }

    limparFiltros() {
        document.getElementById('filtroData').value = '';
        this.dataFiltro = '';
        this.carregarResultados();
    }

    renderizarResultados() {
        const activeTab = document.querySelector('#resultadosTabs .nav-link.active').getAttribute('href');
        
        if (activeTab === '#laudosExames') {
            this.renderizarLaudos();
        } else if (activeTab === '#resumosConsultas') {
            this.renderizarConsultas();
        }
    }

    renderizarLaudos() {
        const container = document.getElementById('listaLaudos');
        container.innerHTML = '';

        if (this.laudoFiltrado.length === 0) {
            this.mostrarVazio(container);
            return;
        }

        this.laudoFiltrado.forEach(laudo => {
            const statusClass = laudo.status === 'normal' ? 'resultado-status-normal' : 'resultado-status-anormal';
            const cardHTML = `
                <div class="col-md-6">
                    <div class="card resultado-card">
                        <div class="resultado-header">
                            <h6 class="mb-0"><i class="fas fa-vial me-2"></i>${laudo.exame}</h6>
                            <small class="d-block">${laudo.data}</small>
                            <span class="badge ${statusClass}">Status: ${laudo.status}</span>
                        </div>
                        <div class="resultado-conteudo">
                            <p class="mb-3"><strong>Resumo:</strong> ${laudo.resumo}</p>
                            <a href="#" class="resultado-anexo" onclick="downloadAnexo('${laudo.anexo}')">
                                <i class="fas fa-download me-1"></i> Baixar Laudo
                            </a>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    renderizarConsultas() {
        const container = document.getElementById('listaConsultas');
        container.innerHTML = '';

        if (this.consultaFiltrada.length === 0) {
            this.mostrarVazio(container);
            return;
        }

        this.consultaFiltrada.forEach(resumo => {
            const cardHTML = `
                <div class="col-md-6">
                    <div class="card resultado-card">
                        <div class="resultado-header">
                            <h6 class="mb-0"><i class="fas fa-stethoscope me-2"></i>Consulta ${resumo.especialidade}</h6>
                            <small class="d-block">${resumo.data} - ${resumo.duracao}min</small>
                            <small class="text-light">${resumo.medico}</small>
                        </div>
                        <div class="resultado-conteudo">
                            <p class="mb-3"><strong>Resumo:</strong> ${resumo.resumo}</p>
                            <div class="alert alert-info">
                                <strong>Recomendações:</strong> ${resumo.recomendacoes}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    mostrarVazio(container) {
        container.innerHTML = '';
        document.getElementById('mensagemVazio').classList.remove('d-none');
    }

    imprimirResultados() {
        window.print(); // Usa CSS @media print
    }
}

// Função auxiliar para download
function downloadAnexo(nomeArquivo) {
    // Simula download (em prod, use backend)
    alert(`Baixando ${nomeArquivo}... (simulado)`);
    // Ex: const link = document.createElement('a'); link.href = `../../assets/anexos/${nomeArquivo}`; link.download = nomeArquivo; link.click();
}

// Funções globais
function filtrarResultados() {
    resultadosSystem.filtrarResultados();
}

function limparFiltros() {
    resultadosSystem.limparFiltros();
}

// Inicializar
let resultadosSystem;
document.addEventListener('DOMContentLoaded', function() {
    resultadosSystem = new ResultadosSystem();
});