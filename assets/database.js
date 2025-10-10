// assets/database.js - Sistema completo de banco de dados
class Database {
    constructor() {
        this.version = '1.0.0';
        this.initDatabase();
    }

    initDatabase() {
        console.log('🔄 Inicializando banco de dados...');
        
        // Inicializar todas as coleções
        this.initCollection('pacientes', []);
        this.initCollection('medicos', []);
        this.initCollection('administradores', []);
        this.initCollection('agendamentos', []);
        this.initCollection('servicos', []);
        this.initCollection('especialidades', []);
        this.initCollection('configuracoes', {});
        
        // Carregar dados iniciais
        this.carregarDadosIniciais();
        
        console.log('✅ Banco de dados inicializado com sucesso');
    }

    initCollection(nome, valorPadrao) {
        if (!localStorage.getItem(nome)) {
            localStorage.setItem(nome, JSON.stringify(valorPadrao));
        }
    }

    carregarDadosIniciais() {
        if (!localStorage.getItem('dadosIniciaisCarregados')) {
            console.log('📥 Carregando dados iniciais...');
            
            // Administradores padrão
            this.setItem('administradores', [
                {
                    id: 1,
                    usuario: 'admin',
                    senha: 'admin123',
                    nome: 'Administrador Principal',
                    email: 'admin@postodecoleta.com',
                    telefone: '(48) 3524-1000',
                    dataCriacao: new Date().toISOString(),
                    ativo: true,
                    nivel: 'super'
                }
            ]);

            // Especialidades médicas
            this.setItem('especialidades', [
                { id: 1, nome: 'Clínico Geral', icone: '👨‍⚕️', descricao: 'Atendimento geral e check-ups' },
                { id: 2, nome: 'Pediatria', icone: '👶', descricao: 'Cuidados com a saúde infantil' },
                { id: 3, nome: 'Cardiologia', icone: '❤️', descricao: 'Doenças do coração e circulação' },
                { id: 4, nome: 'Dermatologia', icone: '🔬', descricao: 'Doenças da pele, cabelos e unhas' },
                { id: 5, nome: 'Ortopedia', icone: '🦴', descricao: 'Problemas ósseos e musculares' },
                { id: 6, nome: 'Ginecologia', icone: '🌸', descricao: 'Saúde da mulher' },
                { id: 7, nome: 'Odontologia', icone: '🦷', descricao: 'Saúde bucal' },
                { id: 8, nome: 'Oftalmologia', icone: '👁️', descricao: 'Saúde ocular' },
                { id: 9, nome: 'Psicologia', icone: '🧠', descricao: 'Saúde mental' },
                { id: 10, nome: 'Nutrição', icone: '🍎', descricao: 'Orientação alimentar' }
            ]);

            // Serviços disponíveis
            this.setItem('servicos', [
                {
                    id: 1,
                    nome: 'Consulta Médica',
                    descricao: 'Atendimento médico especializado',
                    duracao: 30,
                    valor: 150.00,
                    categoria: 'consultas',
                    ativo: true
                },
                {
                    id: 2,
                    nome: 'Exames Laboratoriais',
                    descricao: 'Coleta e análise de exames de sangue, urina, etc',
                    duracao: 15,
                    valor: 80.00,
                    categoria: 'exames',
                    ativo: true
                },
                {
                    id: 3,
                    nome: 'Vacinação',
                    descricao: 'Aplicação de vacinas e imunização',
                    duracao: 20,
                    valor: 50.00,
                    categoria: 'procedimentos',
                    ativo: true
                },
                {
                    id: 4,
                    nome: 'Curativos',
                    descricao: 'Troca de curativos e cuidados com feridas',
                    duracao: 15,
                    valor: 25.00,
                    categoria: 'procedimentos',
                    ativo: true
                },
                {
                    id: 5,
                    nome: 'Telemedicina',
                    descricao: 'Consulta online por vídeo chamada',
                    duracao: 30,
                    valor: 120.00,
                    categoria: 'consultas',
                    ativo: true
                }
            ]);

            // Configurações do sistema
            this.setItem('configuracoes', {
                nomeClinica: 'Posto de Coleta Araranguá',
                telefone: '(48) 3524-1234',
                whatsapp: '(48) 99999-9999',
                email: 'contato@postodecoleta.com',
                endereco: 'Rua Petronilha Jamic, 160 - Centro, Araranguá - SC',
                cnpj: '12.345.678/0001-90',
                horarioFuncionamento: {
                    seg_a_sex: '7h às 18h',
                    sabado: '7h às 12h',
                    domingo: 'Fechado'
                },
                agendamento: {
                    intervalo: 30,
                    horarioInicio: '08:00',
                    horarioFim: '17:00',
                    diasAntecedencia: 30
                }
            });

            localStorage.setItem('dadosIniciaisCarregados', 'true');
            console.log('✅ Dados iniciais carregados com sucesso');
        }
    }

    // Métodos genéricos de CRUD
    getItem(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Erro ao recuperar ${key}:`, error);
            return null;
        }
    }

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            return false;
        }
    }

    // ========== PACIENTES ==========
    getPacientes() {
        return this.getItem('pacientes') || [];
    }

    addPaciente(paciente) {
        const pacientes = this.getPacientes();
        
        // Validações
        if (!paciente.nome || !paciente.email || !paciente.senha) {
            return { success: false, error: 'Nome, email e senha são obrigatórios' };
        }

        // Verificar se email já existe
        if (pacientes.find(p => p.email === paciente.email)) {
            return { success: false, error: 'Email já cadastrado' };
        }

        // Verificar se CPF já existe
        if (paciente.cpf && pacientes.find(p => p.cpf === paciente.cpf)) {
            return { success: false, error: 'CPF já cadastrado' };
        }

        // Criar paciente com dados completos
        const novoPaciente = {
            id: this.gerarId(),
            ...paciente,
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            ativo: true,
            emailVerificado: false,
            ultimoAcesso: null
        };

        pacientes.push(novoPaciente);
        
        if (this.setItem('pacientes', pacientes)) {
            console.log('✅ Paciente cadastrado:', novoPaciente.nome);
            return { success: true, data: novoPaciente };
        } else {
            return { success: false, error: 'Erro ao salvar no banco de dados' };
        }
    }

    updatePaciente(id, dados) {
        const pacientes = this.getPacientes();
        const index = pacientes.findIndex(p => p.id === id);
        
        if (index === -1) {
            return { success: false, error: 'Paciente não encontrado' };
        }

        // Atualizar dados
        pacientes[index] = {
            ...pacientes[index],
            ...dados,
            dataAtualizacao: new Date().toISOString()
        };

        if (this.setItem('pacientes', pacientes)) {
            console.log('✅ Paciente atualizado:', pacientes[index].nome);
            return { success: true, data: pacientes[index] };
        } else {
            return { success: false, error: 'Erro ao atualizar no banco de dados' };
        }
    }

    findPacienteByEmail(email) {
        const pacientes = this.getPacientes();
        return pacientes.find(p => p.email === email && p.ativo);
    }

    findPacienteById(id) {
        const pacientes = this.getPacientes();
        return pacientes.find(p => p.id === id && p.ativo);
    }

    // ========== MÉDICOS ==========
    getMedicos() {
        return this.getItem('medicos') || [];
    }

    addMedico(medico) {
        const medicos = this.getMedicos();
        
        // Validações
        if (!medico.nome || !medico.email || !medico.senha || !medico.crm || !medico.especialidade) {
            return { success: false, error: 'Nome, email, senha, CRM e especialidade são obrigatórios' };
        }

        // Verificar se email já existe
        if (medicos.find(m => m.email === medico.email)) {
            return { success: false, error: 'Email já cadastrado' };
        }

        // Verificar se CRM já existe
        if (medicos.find(m => m.crm === medico.crm)) {
            return { success: false, error: 'CRM já cadastrado' };
        }

        // Criar médico com dados completos
        const novoMedico = {
            id: this.gerarId(),
            ...medico,
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            ativo: true,
            disponivel: true,
            avaliacao: 0,
            totalAvaliacoes: 0,
            foto: null,
            biografia: '',
            formacao: [],
            experiencia: []
        };

        medicos.push(novoMedico);
        
        if (this.setItem('medicos', medicos)) {
            console.log('✅ Médico cadastrado:', novoMedico.nome);
            return { success: true, data: novoMedico };
        } else {
            return { success: false, error: 'Erro ao salvar no banco de dados' };
        }
    }

    updateMedico(id, dados) {
        const medicos = this.getMedicos();
        const index = medicos.findIndex(m => m.id === id);
        
        if (index === -1) {
            return { success: false, error: 'Médico não encontrado' };
        }

        medicos[index] = {
            ...medicos[index],
            ...dados,
            dataAtualizacao: new Date().toISOString()
        };

        if (this.setItem('medicos', medicos)) {
            console.log('✅ Médico atualizado:', medicos[index].nome);
            return { success: true, data: medicos[index] };
        } else {
            return { success: false, error: 'Erro ao atualizar no banco de dados' };
        }
    }

    findMedicoByEmail(email) {
        const medicos = this.getMedicos();
        return medicos.find(m => m.email === email && m.ativo);
    }

    findMedicoById(id) {
        const medicos = this.getMedicos();
        return medicos.find(m => m.id === id && m.ativo);
    }

    getMedicosPorEspecialidade(especialidade) {
        const medicos = this.getMedicos();
        return medicos.filter(m => m.especialidade === especialidade && m.ativo && m.disponivel);
    }

    // ========== ADMINISTRADORES ==========
    getAdministradores() {
        return this.getItem('administradores') || [];
    }

    findAdministradorByUsuario(usuario) {
        const administradores = this.getAdministradores();
        return administradores.find(a => a.usuario === usuario && a.ativo);
    }

    // ========== AGENDAMENTOS ==========
    getAgendamentos() {
        return this.getItem('agendamentos') || [];
    }

    addAgendamento(agendamento) {
        const agendamentos = this.getAgendamentos();
        
        // Validações
        if (!agendamento.pacienteId || !agendamento.medicoId || !agendamento.data || !agendamento.horario) {
            return { success: false, error: 'Dados incompletos para agendamento' };
        }

        // Verificar conflito de horário
        const conflito = agendamentos.find(a => 
            a.medicoId === agendamento.medicoId && 
            a.data === agendamento.data && 
            a.horario === agendamento.horario &&
            a.status === 'agendado'
        );

        if (conflito) {
            return { success: false, error: 'Horário indisponível' };
        }

        // Criar agendamento com dados completos
        const novoAgendamento = {
            id: this.gerarId(),
            ...agendamento,
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            status: 'agendado',
            codigo: this.gerarCodigoAgendamento(),
            checkin: false,
            observacoesMedicas: '',
            valor: 0,
            formaPagamento: '',
            pago: false
        };

        agendamentos.push(novoAgendamento);
        
        if (this.setItem('agendamentos', agendamentos)) {
            console.log('✅ Agendamento criado:', novoAgendamento.codigo);
            return { success: true, data: novoAgendamento };
        } else {
            return { success: false, error: 'Erro ao salvar agendamento' };
        }
    }

    updateAgendamento(id, dados) {
        const agendamentos = this.getAgendamentos();
        const index = agendamentos.findIndex(a => a.id === id);
        
        if (index === -1) {
            return { success: false, error: 'Agendamento não encontrado' };
        }

        agendamentos[index] = {
            ...agendamentos[index],
            ...dados,
            dataAtualizacao: new Date().toISOString()
        };

        if (this.setItem('agendamentos', agendamentos)) {
            console.log('✅ Agendamento atualizado:', agendamentos[index].codigo);
            return { success: true, data: agendamentos[index] };
        } else {
            return { success: false, error: 'Erro ao atualizar agendamento' };
        }
    }

    getAgendamentosByPaciente(pacienteId) {
        const agendamentos = this.getAgendamentos();
        return agendamentos.filter(a => a.pacienteId === pacienteId)
                          .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    }

    getAgendamentosByMedico(medicoId) {
        const agendamentos = this.getAgendamentos();
        return agendamentos.filter(a => a.medicoId === medicoId)
                          .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    }

    getAgendamentosPorData(data, medicoId = null) {
        const agendamentos = this.getAgendamentos();
        let filtrados = agendamentos.filter(a => a.data === data && a.status === 'agendado');
        
        if (medicoId) {
            filtrados = filtrados.filter(a => a.medicoId === medicoId);
        }
        
        return filtrados.sort((a, b) => a.horario.localeCompare(b.horario));
    }

    // ========== SERVIÇOS ==========
    getServicos() {
        return this.getItem('servicos') || [];
    }

    getServicosAtivos() {
        const servicos = this.getServicos();
        return servicos.filter(s => s.ativo);
    }

    getServicosPorCategoria(categoria) {
        const servicos = this.getServicosAtivos();
        return servicos.filter(s => s.categoria === categoria);
    }

    // ========== ESPECIALIDADES ==========
    getEspecialidades() {
        return this.getItem('especialidades') || [];
    }

    getEspecialidadeById(id) {
        const especialidades = this.getEspecialidades();
        return especialidades.find(e => e.id === id);
    }

    // ========== CONFIGURAÇÕES ==========
    getConfiguracoes() {
        return this.getItem('configuracoes') || {};
    }

    updateConfiguracoes(dados) {
        const configuracoes = this.getConfiguracoes();
        const novasConfiguracoes = { ...configuracoes, ...dados };
        
        if (this.setItem('configuracoes', novasConfiguracoes)) {
            console.log('✅ Configurações atualizadas');
            return { success: true, data: novasConfiguracoes };
        } else {
            return { success: false, error: 'Erro ao atualizar configurações' };
        }
    }

    // ========== UTILITÁRIOS ==========
    gerarId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    gerarCodigoAgendamento() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        for (let i = 0; i < 6; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return codigo;
    }

    // ========== ESTATÍSTICAS ==========
    getEstatisticas() {
        const pacientes = this.getPacientes().filter(p => p.ativo);
        const medicos = this.getMedicos().filter(m => m.ativo);
        const agendamentos = this.getAgendamentos();
        
        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = agendamentos.filter(a => a.data === hoje && a.status === 'agendado');
        
        return {
            totalPacientes: pacientes.length,
            totalMedicos: medicos.length,
            totalAgendamentos: agendamentos.length,
            agendamentosHoje: agendamentosHoje.length,
            agendamentosAtivos: agendamentos.filter(a => a.status === 'agendado').length,
            agendamentosConcluidos: agendamentos.filter(a => a.status === 'concluido').length,
            agendamentosCancelados: agendamentos.filter(a => a.status === 'cancelado').length
        };
    }

    // ========== BACKUP E RESTAURAÇÃO ==========
    fazerBackup() {
        const backup = {
            version: this.version,
            timestamp: new Date().toISOString(),
            data: {
                pacientes: this.getPacientes(),
                medicos: this.getMedicos(),
                administradores: this.getAdministradores(),
                agendamentos: this.getAgendamentos(),
                servicos: this.getServicos(),
                especialidades: this.getEspecialidades(),
                configuracoes: this.getConfiguracoes()
            }
        };
        
        return backup;
    }

    restaurarBackup(backup) {
        try {
            if (backup.version !== this.version) {
                return { success: false, error: 'Versão do backup incompatível' };
            }

            for (const [key, value] of Object.entries(backup.data)) {
                this.setItem(key, value);
            }

            console.log('✅ Backup restaurado com sucesso');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error);
            return { success: false, error: 'Erro ao restaurar backup' };
        }
    }

    // ========== LIMPEZA ==========
    limparDados() {
        if (confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados. Continuar?')) {
            const collections = ['pacientes', 'medicos', 'administradores', 'agendamentos', 'servicos', 'especialidades'];
            
            collections.forEach(collection => {
                localStorage.removeItem(collection);
            });
            
            localStorage.removeItem('dadosIniciaisCarregados');
            
            console.log('🗑️ Todos os dados foram removidos');
            this.initDatabase();
            
            return { success: true, message: 'Dados limpos e reinicializados' };
        }
        
        return { success: false, message: 'Operação cancelada' };
    }

    // ========== DADOS EXEMPLO ==========
    carregarDadosExemplo() {
        if (!localStorage.getItem('dadosExemploCarregados')) {
            console.log('📚 Carregando dados de exemplo...');

            // Pacientes exemplo
            this.addPaciente({
                nome: "João Silva",
                email: "joao@email.com",
                senha: "123456",
                cpf: "12345678900",
                idade: 30,
                sexo: "masculino",
                endereco: "Rua Exemplo, 123 - Centro - Araranguá/SC",
                telefone: "(48) 99999-1111",
                convenio: "Unimed",
                alergias: "Penicilina",
                medicamentos: "Nenhum"
            });

            this.addPaciente({
                nome: "Maria Santos",
                email: "maria@email.com", 
                senha: "123456",
                cpf: "98765432100",
                idade: 25,
                sexo: "feminino",
                endereco: "Avenida Principal, 456 - Centro - Araranguá/SC",
                telefone: "(48) 99999-2222",
                convenio: "SUS",
                alergias: "Nenhuma",
                medicamentos: "Anticoncepcional"
            });

            // Médicos exemplo
            this.addMedico({
                nome: "Dra. Ana Costa",
                email: "ana.costa@clinica.com",
                senha: "123456",
                crm: "CRM/SC 12345",
                idade: 35,
                sexo: "feminino",
                especialidade: "Clínico Geral",
                telefone: "(48) 99999-3333",
                formacao: ["Medicina - UFSC", "Residência em Clínica Médica"],
                experiencia: "5 anos de experiência em atendimento geral",
                biografia: "Comprometida com a saúde e bem-estar dos pacientes"
            });

            this.addMedico({
                nome: "Dr. Pedro Almeida",
                email: "pedro.almeida@clinica.com",
                senha: "123456", 
                crm: "CRM/SC 67890",
                idade: 42,
                sexo: "masculino",
                especialidade: "Cardiologia",
                telefone: "(48) 99999-4444",
                formacao: ["Medicina - USP", "Especialização em Cardiologia"],
                experiencia: "10 anos de experiência em cardiologia",
                biografia: "Especialista em doenças cardiovasculares"
            });

            // Agendamentos exemplo
            const amanha = new Date();
            amanha.setDate(amanha.getDate() + 1);
            const dataAmanha = amanha.toISOString().split('T')[0];

            this.addAgendamento({
                pacienteId: 1,
                pacienteNome: "João Silva",
                medicoId: 1, 
                medicoNome: "Dra. Ana Costa - Clínico Geral",
                especialidade: "Clínico Geral",
                data: dataAmanha,
                horario: "09:00",
                observacoes: "Check-up anual"
            });

            localStorage.setItem('dadosExemploCarregados', 'true');
            console.log('✅ Dados de exemplo carregados com sucesso');
        }
    }
} // ← AQUI ESTÁ O FECHAMENTO DA CLASSE QUE ESTAVA FALTANDO

// Inicializar e exportar instância global
const database = new Database();
window.database = database;

// Funções globais para compatibilidade
window.getCurrentUser = function() {
    const userData = localStorage.getItem('usuarioLogado');
    return userData ? JSON.parse(userData) : null;
};

window.cadastrarUsuario = function(tipo, dados) {
    if (tipo === 'paciente') {
        return database.addPaciente(dados);
    } else if (tipo === 'medico') {
        return database.addMedico(dados);
    }
    return { success: false, error: 'Tipo de usuário inválido' };
};
window.loginUsuario = function(tipo, email, senha) {
    let user = null;
    if (tipo === 'paciente') {
        user = database.findPacienteByEmail(email);
    }  else if (tipo === 'medico') {
        user = database.findMedicoByEmail(email);
    } else if (tipo === 'adm') {
        user = database.findAdministradorByUsuario(email);
    } else {
        return { success: false, error: 'Tipo de usuário inválido' };
    }        
    if (user && user.senha === senha) {
        localStorage.setItem('usuarioLogado', JSON.stringify(user));
        user.ultimoAcesso = new Date().toISOString();
        if (tipo === 'paciente') {
            database.updatePaciente(user.id, { ultimoAcesso: user.ultimoAcesso });
        } else if (tipo === 'medico') {
            database.updateMedico(user.id, { ultimoAcesso: user.ultimoAcesso });
        }
        return { success: true, data: user };
    }
    return { success: false, error: 'Email ou senha incorretos' };
};

// Carregar dados de exemplo para testes (descomente se necessário)
// database.carregarDadosExemplo();
// assets/navbar.js - Navbar dinâmica com ícones e navegação universal
// Passo 1: Determinar baseHref dinamicamente
let baseHref = ''; // Caminho base padrão
const pathParts = window.location.pathname.split('/').filter(part => part);
if (pathParts.length > 0) {
    if (pathParts[0] === 'admin') {
        baseHref = '../';
    } else if (pathParts[0] === 'cadastro') {
        baseHref = '../../';
    }   
    else if (pathParts[0] === 'agendamento') {
        baseHref = '../';
    }
    else {
        baseHref = '';
    }
}

// Passo 2: Injetar HTML da navbar  dinamicamente
const navbarHTML = `
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}index.html"><i class="fas fa-home me-1"></i>Início</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}servicos/servicos.html"><i class="fas fa-list-alt me-1"></i>Serviços</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}profissionais/profissionais.html"><i class="fas fa-users me-1"></i>Profissionais</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}localizacao/localizacao.html"><i class="fas fa-map
-marker-alt me-1"></i>Localização</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}agendamento/agendamento.html"><i class="fas fa-calendar-check me-1"></i>Agendamentos</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="${baseHref}login/login.html"><i class="fas fa-sign-in-alt me-1"></i>Login</a>
                </li>
            </ul>
        </div>
    </div>
</nav>
`; 
// Injetar navbar no body (antes do primeiro conteúdo)
if (document.body.children.length > 0) {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
} else {
    document.body.innerHTML = navbarHTML + document.body.innerHTML;
}
// assets/laudosResumos.js - Gerenciamento de laudos e resumos de consultas

// Inicializar dados de laudos e resumos se não existirem
database.init = function() {
    // ... (código init existente) ...

    // Inicializar laudos de exemplo (para paciente ID 1 - João Silva)
    if (!localStorage.getItem('laudos')) {
        const laudosExemplo = [
            {
                id: 1,
                pacienteId: 1, // ID do paciente
                data: '2025-10-01',
                tipoExame: 'Hemograma Completo',
                resultado: '<strong>Resultados Normais:</strong><br>Glóbulos Vermelhos: 4.5M/µL (normal)<br>Hemoglobina: 13.5 g/dL (normal)<br>Observações: Sem alterações significativas.',
                status: 'normal',
                anexo: 'hemograma.pdf' // Simulado; em produção, URL real
            },
            {
                id: 2,
                pacienteId: 1,
                data: '2025-10-05',
                tipoExame: 'Raio-X Tórax',
                resultado: '<strong>Laudo Radiológico:</strong><br>Pulmões limpos, sem infiltrados. Coração de tamanho normal. Sem alterações agudas.',
                status: 'normal',
                anexo: 'raio-x.pdf'
            },
            {
                id: 3,
                pacienteId: 1,
                data: '2025-10-07',
                tipoExame: 'Glicemia de Jejum',
                resultado: '<strong>Resultado: 95 mg/dL</strong><br><em>Referência: 70-99 mg/dL (normal)</em><br>Recomendação: Manter dieta equilibrada.',
                status: 'normal',
                anexo: 'glicemia.pdf'
            }
        ];
        localStorage.setItem('laudos', JSON.stringify(laudosExemplo));
    }

    // Inicializar resumos de consultas de exemplo
    if (!localStorage.getItem('resumosConsultas')) {
        const resumosExemplo = [
            {
                id: 1,
                pacienteId: 1,
                data: '2025-10-02',
                medico: 'Dr. João Silva',
                especialidade: 'Clínica Geral',
                resumo: 'Paciente com queixa de fadiga. Exame físico normal. Solicitados hemograma e glicemia.',
                recomendacoes: 'Repouso, hidratação e aguardar resultados dos exames.',
                duracao: 30
            },
            {
                id: 2,
                pacienteId: 1,
                data: '2025-10-06',
                medico: 'Dra. Maria Oliveira',
                especialidade: 'Pediatria',
                resumo: 'Acompanhamento de rotina. Crescimento adequado, vacinação em dia.',
                recomendacoes: 'Próxima consulta em 6 meses. Manter aleitamento materno.',
                duracao: 45
            }
        ];
        localStorage.setItem('resumosConsultas', JSON.stringify(resumosExemplo));
    }
};

// Funções para laudos
database.getLaudos = function(pacienteId) {
    const laudos = JSON.parse(localStorage.getItem('laudos')) || [];
    return laudos.filter(l => l.pacienteId === pacienteId);
};

database.addLaudo = function(laudo) {
    const laudos = JSON.parse(localStorage.getItem('laudos')) || [];
    laudo.id = Date.now();
    laudos.push(laudo);
    localStorage.setItem('laudos', JSON.stringify(laudos));
    return { success: true };
};

// Funções para resumos de consultas
database.getResumosConsultas = function(pacienteId) {
    const resumos = JSON.parse(localStorage.getItem('resumosConsultas')) || [];
    return resumos.filter(r => r.pacienteId === pacienteId);
};

database.addResumoConsulta = function(resumo) {
    const resumos = JSON.parse(localStorage.getItem('resumosConsultas')) || [];
    resumo.id = Date.now();
    resumos.push(resumo);
    localStorage.setItem('resumosConsultas', JSON.stringify(resumos));
    return { success: true };
};

database.init(); // Chamar init para garantir dados iniciais e exemplos

// assets/navbar.js - Navbar fixa com ícones e navegação universal


console.log('🏥 Sistema de banco de dados carregado e pronto');