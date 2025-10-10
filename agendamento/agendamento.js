// agendamento/agendamento.js - Sistema completo de agendamento
class AgendamentoSystem {
    constructor() {
        this.usuario = null;
        this.medicoSelecionado = null;
        this.init();
    }

    init() {
        console.log('📅 Sistema de agendamento inicializado');
        
        // Verificar autenticação
        this.usuario = verificarAutenticacao('paciente');
        if (!this.usuario) return;

        this.configurarEventListeners();
        this.inicializarFormulario();
        this.carregarMeusAgendamentos();
        this.atualizarSaudacaoUsuario();
    }

    configurarEventListeners() {
        // Event listeners do formulário
        document.getElementById('especialidade').addEventListener('change', () => this.carregarMedicos());
        document.getElementById('medico').addEventListener('change', () => this.carregarInfoMedico());
        document.getElementById('dataConsulta').addEventListener('change', () => this.carregarHorarios());
        document.getElementById('formAgendamento').addEventListener('submit', (e) => this.realizarAgendamento(e));

        // Event listener para observações (contador de caracteres)
        document.getElementById('observacoes').addEventListener('input', (e) => {
            this.atualizarContadorCaracteres(e.target);
        });

        // Event listener para atualizar horários quando médico mudar
        document.getElementById('medico').addEventListener('change', () => {
            if (document.getElementById('dataConsulta').value) {
                this.carregarHorarios();
            }
        });
    }

    inicializarFormulario() {
        // Configurar data mínima (hoje)
        const dataInput = document.getElementById('dataConsulta');
        const hoje = new Date().toISOString().split('T')[0];
        dataInput.min = hoje;

        // Configurar data máxima (30 dias no futuro)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        dataInput.max = maxDate.toISOString().split('T')[0];

        // Carregar especialidades disponíveis
        this.carregarEspecialidades();
    }

    atualizarSaudacaoUsuario() {
        const elemento = document.getElementById('userWelcome');
        if (elemento && this.usuario) {
            elemento.textContent = `Olá, ${this.usuario.dados.nome}`;
        }
    }

    carregarEspecialidades() {
        const especialidades = database.getEspecialidades();
        const select = document.getElementById('especialidade');
        
        // Limpar opções exceto a primeira
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar especialidades
        especialidades.forEach(especialidade => {
            const option = document.createElement('option');
            option.value = especialidade.nome;
            option.textContent = `${especialidade.icone} ${especialidade.nome}`;
            select.appendChild(option);
        });
    }

    carregarMedicos() {
        const especialidade = document.getElementById('especialidade').value;
        const medicoSelect = document.getElementById('medico');
        
        medicoSelect.innerHTML = '<option value="">Selecione um médico</option>';
        medicoSelect.disabled = !especialidade;

        if (!especialidade) {
            document.getElementById('medicoInfo').style.display = 'none';
            return;
        }

        const medicos = database.getMedicosPorEspecialidade(especialidade);
        
        if (medicos.length === 0) {
            medicoSelect.innerHTML = '<option value="">Nenhum médico disponível para esta especialidade</option>';
            medicoSelect.disabled = true;
            document.getElementById('medicoInfo').style.display = 'none';
            return;
        }

        medicos.forEach(medico => {
            const option = document.createElement('option');
            option.value = medico.id;
            option.textContent = `Dr(a). ${medico.nome} - ${medico.especialidade}`;
            option.setAttribute('data-medico', JSON.stringify(medico));
            medicoSelect.appendChild(option);
        });

        // Resetar horários
        document.getElementById('horario').innerHTML = '<option value="">Selecione a data primeiro</option>';
        document.getElementById('horario').disabled = true;
        document.getElementById('medicoInfo').style.display = 'none';
    }

    carregarInfoMedico() {
        const medicoSelect = document.getElementById('medico');
        const medicoInfo = document.getElementById('medicoInfo');
        const medicoDetalhes = document.getElementById('medicoDetalhes');
        
        if (!medicoSelect.value) {
            medicoInfo.style.display = 'none';
            this.medicoSelecionado = null;
            return;
        }

        const optionSelecionada = medicoSelect.selectedOptions[0];
        this.medicoSelecionado = JSON.parse(optionSelecionada.getAttribute('data-medico'));

        medicoDetalhes.innerHTML = `
            <div class="col-md-2 text-center">
                <div class="medico-avatar">
                    ${this.medicoSelecionado.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
            </div>
            <div class="col-md-10">
                <h5 class="text-primary">Dr(a). ${this.medicoSelecionado.nome}</h5>
                <p class="mb-1"><strong>Especialidade:</strong> ${this.medicoSelecionado.especialidade}</p>
                <p class="mb-1"><strong>CRM:</strong> ${this.medicoSelecionado.crm}</p>
                ${this.medicoSelecionado.experiencia ? `<p class="mb-1"><strong>Experiência:</strong> ${this.medicoSelecionado.experiencia}</p>` : ''}
                ${this.medicoSelecionado.biografia ? `<p class="mb-0"><strong>Sobre:</strong> ${this.medicoSelecionado.biografia}</p>` : ''}
            </div>
        `;

        medicoInfo.style.display = 'block';
    }

    carregarHorarios() {
        const data = document.getElementById('dataConsulta').value;
        const medicoId = document.getElementById('medico').value;
        const horarioSelect = document.getElementById('horario');
        
        horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
        horarioSelect.disabled = !data || !medicoId;

        if (!data || !medicoId) return;

        // Verificar se é fim de semana
        const dataObj = new Date(data);
        const diaSemana = dataObj.getDay();
        if (diaSemana === 0) { // Domingo
            horarioSelect.innerHTML = '<option value="">Não há atendimento aos domingos</option>';
            horarioSelect.disabled = true;
            return;
        }

        // Horários disponíveis (8h às 17h, de 30 em 30 minutos)
        const horarios = this.gerarHorariosDisponiveis();

        // Verificar horários já agendados
        const agendamentos = database.getAgendamentosPorData(data, parseInt(medicoId));
        const horariosOcupados = agendamentos.map(a => a.horario);

        let horariosDisponiveis = 0;

        horarios.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            
            const horarioOcupado = horariosOcupados.includes(horario);
            
            if (horarioOcupado) {
                option.textContent = `${horario} - Indisponível`;
                option.disabled = true;
                option.classList.add('text-danger');
            } else {
                option.textContent = horario;
                horariosDisponiveis++;
            }
            
            horarioSelect.appendChild(option);
        });

        // Se não há horários disponíveis
        if (horariosDisponiveis === 0) {
            horarioSelect.innerHTML = '<option value="">Nenhum horário disponível para esta data</option>';
            horarioSelect.disabled = true;
        }
    }

    gerarHorariosDisponiveis() {
        const horarios = [];
        const inicio = 8; // 8:00
        const fim = 17;   // 17:00
        
        for (let hora = inicio; hora <= fim; hora++) {
            // Horários cheios (00) e meia-hora (30)
            if (hora < fim) {
                horarios.push(`${hora.toString().padStart(2, '0')}:00`);
            }
            if (hora < fim) {
                horarios.push(`${hora.toString().padStart(2, '0')}:30`);
            }
        }
        
        return horarios;
    }

    atualizarContadorCaracteres(textarea) {
        const maxCaracteres = 500;
        const caracteresAtuais = textarea.value.length;
        const contador = textarea.nextElementSibling;
        
        if (contador && contador.classList.contains('form-text')) {
            contador.textContent = `${caracteresAtuais}/${maxCaracteres} caracteres`;
            
            if (caracteresAtuais > maxCaracteres) {
                contador.classList.add('text-danger');
                textarea.classList.add('campo-invalido');
            } else {
                contador.classList.remove('text-danger');
                textarea.classList.remove('campo-invalido');
            }
        }
    }

    async realizarAgendamento(e) {
        e.preventDefault();
        
        console.log('📝 Iniciando processo de agendamento...');

        // Validar formulário
        if (!this.validarFormulario()) {
            return;
        }

        // Mostrar loading
        this.mostrarLoading(true);

        try {
            // Coletar dados do formulário
            const dadosAgendamento = this.coletarDadosAgendamento();

            // Verificar conflito final (em caso de race condition)
            const conflito = this.verificarConflitoAgendamento(dadosAgendamento);
            if (conflito) {
                this.mostrarErro('Este horário foi reservado enquanto você preenchia o formulário. Por favor, selecione outro horário.');
                this.carregarHorarios(); // Recarregar horários
                return;
            }

            // Realizar agendamento
            const resultado = database.addAgendamento(dadosAgendamento);
            
            if (resultado.success) {
                this.mostrarSucesso('Agendamento realizado com sucesso!');
                this.limparFormulario();
                this.carregarMeusAgendamentos();
                
                // Mostrar resumo do agendamento
                this.mostrarResumoAgendamento(resultado.data);
                
            } else {
                this.mostrarErro(resultado.error || 'Erro ao realizar agendamento. Tente novamente.');
            }

        } catch (error) {
            console.error('Erro no agendamento:', error);
            this.mostrarErro('Erro inesperado ao realizar agendamento. Tente novamente.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    validarFormulario() {
        const especialidade = document.getElementById('especialidade').value;
        const medico = document.getElementById('medico').value;
        const data = document.getElementById('dataConsulta').value;
        const horario = document.getElementById('horario').value;
        const observacoes = document.getElementById('observacoes').value;

        // Remover estilos de erro anteriores
        this.removerEstilosErro();

        let valido = true;

        if (!especialidade) {
            this.adicionarEstiloErro('especialidade');
            valido = false;
        }

        if (!medico) {
            this.adicionarEstiloErro('medico');
            valido = false;
        }

        if (!data) {
            this.adicionarEstiloErro('dataConsulta');
            valido = false;
        }

        if (!horario) {
            this.adicionarEstiloErro('horario');
            valido = false;
        }

        if (observacoes.length > 500) {
            this.adicionarEstiloErro('observacoes');
            this.mostrarErro('As observações devem ter no máximo 500 caracteres.');
            valido = false;
        }

        if (!valido) {
            this.mostrarErro('Por favor, preencha todos os campos obrigatórios corretamente.');
        }

        return valido;
    }

    coletarDadosAgendamento() {
        const especialidade = document.getElementById('especialidade').value;
        const medicoId = parseInt(document.getElementById('medico').value);
        const medicoNome = document.getElementById('medico').selectedOptions[0].text;
        const data = document.getElementById('dataConsulta').value;
        const horario = document.getElementById('horario').value;
        const observacoes = document.getElementById('observacoes').value;

        return {
            pacienteId: this.usuario.dados.id,
            pacienteNome: this.usuario.dados.nome,
            medicoId: medicoId,
            medicoNome: medicoNome,
            especialidade: especialidade,
            data: data,
            horario: horario,
            observacoes: observacoes.trim(),
            valor: this.calcularValorConsulta(especialidade)
        };
    }

    calcularValorConsulta(especialidade) {
        const valores = {
            'Clínico Geral': 150.00,
            'Pediatria': 160.00,
            'Cardiologia': 220.00,
            'Dermatologia': 180.00,
            'Ortopedia': 200.00,
            'Ginecologia': 170.00,
            'Odontologia': 120.00,
            'Oftalmologia': 190.00,
            'Psicologia': 130.00,
            'Nutrição': 100.00
        };
        
        return valores[especialidade] || 150.00;
    }

    verificarConflitoAgendamento(dados) {
        const agendamentos = database.getAgendamentosPorData(dados.data, dados.medicoId);
        return agendamentos.some(ag => ag.horario === dados.horario);
    }

    carregarMeusAgendamentos() {
        const agendamentos = database.getAgendamentosByPaciente(this.usuario.dados.id);
        const container = document.getElementById('listaAgendamentos');
        const section = document.getElementById('meusAgendamentos');
        const semAgendamentos = document.getElementById('semAgendamentos');

        if (agendamentos.length === 0) {
            section.style.display = 'block';
            container.innerHTML = '';
            semAgendamentos.style.display = 'block';
            return;
        }

        section.style.display = 'block';
        semAgendamentos.style.display = 'none';
        container.innerHTML = '';

        // Ordenar por data (mais recentes primeiro)
        agendamentos.sort((a, b) => new Date(b.data + 'T' + b.horario) - new Date(a.data + 'T' + a.horario));

        agendamentos.forEach(agendamento => {
            const agendamentoElement = this.criarElementoAgendamento(agendamento);
            container.appendChild(agendamentoElement);
        });
    }

    criarElementoAgendamento(agendamento) {
        const element = document.createElement('div');
        element.className = 'col-12 mb-3';
        
        const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
        const dataCriacaoFormatada = new Date(agendamento.dataCriacao).toLocaleDateString('pt-BR');
        const statusClass = `status-${agendamento.status}`;
        const badgeColor = this.getBadgeColor(agendamento.status);
        
        // Verificar se é hoje
        const hoje = new Date().toISOString().split('T')[0];
        const ehHoje = agendamento.data === hoje;
        const destaqueHoje = ehHoje ? 'border-warning' : '';

        element.innerHTML = `
            <div class="card agendamento-item ${statusClass} ${destaqueHoje}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="card-title text-primary mb-0">${agendamento.especialidade}</h5>
                                <span class="badge bg-${badgeColor} badge-status">${agendamento.status}</span>
                            </div>
                            
                            <p class="card-text mb-2">
                                <i class="fas fa-user-md me-1 text-muted"></i>
                                <strong>Médico:</strong> ${agendamento.medicoNome}
                            </p>
                            
                            <p class="card-text mb-2">
                                <i class="fas fa-calendar-day me-1 text-muted"></i>
                                <strong>Data:</strong> ${dataFormatada} às ${agendamento.horario}
                                ${ehHoje ? '<span class="badge bg-warning text-dark ms-2">Hoje</span>' : ''}
                            </p>
                            
                            ${agendamento.observacoes ? `
                                <p class="card-text mb-2">
                                    <i class="fas fa-notes-medical me-1 text-muted"></i>
                                    <strong>Observações:</strong> ${agendamento.observacoes}
                                </p>
                            ` : ''}
                            
                            <p class="card-text mb-0">
                                <i class="fas fa-hashtag me-1 text-muted"></i>
                                <strong>Código:</strong> <span class="font-monospace">${agendamento.codigo}</span>
                            </p>
                        </div>
                        
                        <div class="text-end ms-3">
                            <small class="text-muted d-block">Agendado em:</small>
                            <small class="text-muted">${dataCriacaoFormatada}</small>
                            
                            ${agendamento.status === 'agendado' ? `
                                <div class="agendamento-actions mt-2">
                                    <button class="btn btn-outline-danger btn-sm" 
                                            onclick="agendamentoSystem.cancelarAgendamento(${agendamento.id})"
                                            title="Cancelar agendamento">
                                        <i class="fas fa-times me-1"></i>Cancelar
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return element;
    }

    getBadgeColor(status) {
        const cores = {
            'agendado': 'primary',
            'concluido': 'success',
            'cancelado': 'danger'
        };
        return cores[status] || 'secondary';
    }

    cancelarAgendamento(agendamentoId) {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
            return;
        }

        const resultado = database.updateAgendamento(agendamentoId, {
            status: 'cancelado',
            dataCancelamento: new Date().toISOString()
        });

        if (resultado.success) {
            this.mostrarSucesso('Agendamento cancelado com sucesso!');
            this.carregarMeusAgendamentos();
            
            if (typeof notificacao !== 'undefined') {
                notificacao.info('Agendamento cancelado. Entre em contato para remarcar.');
            }
        } else {
            this.mostrarErro('Erro ao cancelar agendamento. Tente novamente.');
        }
    }

    mostrarResumoAgendamento(agendamento) {
        const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
        
        const modalHTML = `
            <div class="modal fade" id="resumoAgendamento" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-check-circle me-2"></i>Agendamento Confirmado!
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="fas fa-calendar-check fa-3x text-success mb-3"></i>
                                <h4 class="text-success">Consulta Agendada</h4>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6 class="alert-heading">Resumo do Agendamento</h6>
                                <p class="mb-1"><strong>Paciente:</strong> ${agendamento.pacienteNome}</p>
                                <p class="mb-1"><strong>Médico:</strong> ${agendamento.medicoNome}</p>
                                <p class="mb-1"><strong>Data:</strong> ${dataFormatada} às ${agendamento.horario}</p>
                                <p class="mb-1"><strong>Especialidade:</strong> ${agendamento.especialidade}</p>
                                <p class="mb-0"><strong>Código:</strong> <span class="font-monospace">${agendamento.codigo}</span></p>
                            </div>
                            
                            <div class="alert alert-warning">
                                <h6 class="alert-heading">📋 Lembrete Importante</h6>
                                <p class="mb-1">• Chegue com 15 minutos de antecedência</p>
                                <p class="mb-1">• Traga documentos e carteirinha do convênio</p>
                                <p class="mb-0">• Para cancelamentos: (48) 3524-1234 (24h antes)</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-success" onclick="window.print()">
                                <i class="fas fa-print me-1"></i>Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('resumoAgendamento'));
        modal.show();

        // Limpar após fechar
        document.getElementById('resumoAgendamento').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // Métodos de UI
    mostrarLoading(mostrar) {
        const btn = document.querySelector('#formAgendamento button[type="submit"]');
        
        if (mostrar) {
            btn.classList.add('loading');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Agendando...';
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calendar-check me-2"></i>Confirmar Agendamento';
        }
    }

    mostrarSucesso(mensagem) {
        this.limparMensagens();
        const elemento = document.getElementById('mensagemSucesso');
        const texto = document.getElementById('textoSucesso');
        
        if (elemento && texto) {
            texto.textContent = mensagem;
            elemento.style.display = 'block';
            elemento.classList.add('fade-in');
        }

        // Scroll para a mensagem
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    mostrarErro(mensagem) {
        this.limparMensagens();
        const elemento = document.getElementById('mensagemErro');
        const texto = document.getElementById('textoErro');
        
        if (elemento && texto) {
            texto.textContent = mensagem;
            elemento.style.display = 'block';
            elemento.classList.add('fade-in');
        }

        // Scroll para a mensagem
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    limparMensagens() {
        const mensagens = document.querySelectorAll('#mensagemErro, #mensagemSucesso');
        mensagens.forEach(msg => {
            msg.style.display = 'none';
            msg.classList.remove('fade-in');
        });
    }

    adicionarEstiloErro(campoId) {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.classList.add('campo-invalido');
        }
    }

    removerEstilosErro() {
        document.querySelectorAll('.campo-invalido').forEach(el => {
            el.classList.remove('campo-invalido');
        });
    }

    limparFormulario() {
        document.getElementById('formAgendamento').reset();
        document.getElementById('medico').disabled = true;
        document.getElementById('horario').disabled = true;
        document.getElementById('medicoInfo').style.display = 'none';
        this.medicoSelecionado = null;
        
        // Resetar contador de caracteres
        const observacoes = document.getElementById('observacoes');
        const contador = observacoes.nextElementSibling;
        if (contador && contador.classList.contains('form-text')) {
            contador.textContent = 'Máximo 500 caracteres';
            contador.classList.remove('text-danger');
        }
        
        this.limparMensagens();
    }

    recarregarAgendamentos() {
        this.carregarMeusAgendamentos();
        
        if (typeof notificacao !== 'undefined') {
            notificacao.sucesso('Lista de agendamentos atualizada!');
        }
    }
}

// Inicializar sistema de agendamento
let agendamentoSystem;

document.addEventListener('DOMContentLoaded', function() {
    agendamentoSystem = new AgendamentoSystem();
});

// Funções globais para compatibilidade
window.agendamentoSystem = agendamentoSystem;