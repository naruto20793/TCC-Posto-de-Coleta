// consultas/pacientes.js - Página de visualização de pacientes (Médicos e Admins)

const API_URL = 'http://localhost:5000/api';

// Controlar acesso
let usuarioAtual = null;
let pacientes = [];
let pacientesFiltrados = [];

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarPacientes();
    
    // Event listeners
    document.getElementById('buscaNome').addEventListener('input', filtrarPacientes);
    document.getElementById('btnAtualizar').addEventListener('click', carregarPacientes);
    
    // Fechar modal ao clicar fora
    document.getElementById('modalDetalhes').addEventListener('click', (e) => {
        if (e.target.id === 'modalDetalhes') {
            fecharModal();
        }
    });
});

/**
 * Verificar se usuário é médico ou admin
 */
function verificarAutenticacao() {
    // Simular usuário autenticado (em produção seria JWT)
    usuarioAtual = JSON.parse(localStorage.getItem('usuarioAtual') || JSON.stringify({
        tipo: 'admin', // 'admin', 'medico' ou 'paciente'
        nome: 'Usuário Demo',
        id: '1'
    }));

    // Verificar permissão
    if (usuarioAtual.tipo !== 'admin' && usuarioAtual.tipo !== 'medico') {
        mostrarAviso('aviso-warning', 'Acesso restrito: Apenas médicos e administradores podem visualizar esta página');
        document.getElementById('tabelaPacientes').style.opacity = '0.5';
        document.getElementById('tabelaPacientes').style.pointerEvents = 'none';
    }
}

/**
 * Carregar todos os pacientes da API
 */
async function carregarPacientes() {
    try {
        mostrarCarregando(true);
        
        const response = await fetch(`${API_URL}/pacientes`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar pacientes');
        }
        
        pacientes = await response.json();
        pacientesFiltrados = [...pacientes];
        
        // Atualizar tabela e estatísticas
        atualizarTabela();
        atualizarEstatisticas();
        
        mostrarAviso('aviso-success', `✅ ${pacientes.length} pacientes carregados com sucesso!`);
        
        // Limpar avisos após 3 segundos
        setTimeout(() => {
            document.getElementById('aviso-success').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarAviso('aviso-error', `❌ Erro ao carregar pacientes: ${error.message}`);
    } finally {
        mostrarCarregando(false);
    }
}

/**
 * Filtrar pacientes por nome ou CPF
 */
function filtrarPacientes() {
    const termo = document.getElementById('buscaNome').value.toLowerCase();
    
    if (termo.trim() === '') {
        pacientesFiltrados = [...pacientes];
    } else {
        pacientesFiltrados = pacientes.filter(p => 
            (p.nome && p.nome.toLowerCase().includes(termo)) ||
            (p.cpf && p.cpf.includes(termo)) ||
            (p.email && p.email.toLowerCase().includes(termo))
        );
    }
    
    atualizarTabela();
}

/**
 * Atualizar tabela de pacientes
 */
function atualizarTabela() {
    const corpo = document.getElementById('corpoPacientes');
    const tabelaPacientes = document.getElementById('tabelaPacientes');
    const mensagemVazio = document.getElementById('mensagemVazio');
    
    if (pacientesFiltrados.length === 0) {
        corpo.innerHTML = '';
        tabelaPacientes.style.display = 'none';
        mensagemVazio.style.display = 'block';
        return;
    }
    
    tabelaPacientes.style.display = 'table';
    mensagemVazio.style.display = 'none';
    
    corpo.innerHTML = pacientesFiltrados.map(paciente => `
        <tr>
            <td>
                <code class="id-pequeno">${paciente._id.substring(0, 8)}...</code>
            </td>
            <td>
                <strong>${paciente.nome}</strong>
            </td>
            <td>
                ${formatarCPF(paciente.cpf || 'N/A')}
            </td>
            <td>
                <a href="mailto:${paciente.email}" title="Enviar email">
                    ${paciente.email}
                </a>
            </td>
            <td>
                <a href="tel:${paciente.telefone}" title="Ligar">
                    ${formatarTelefone(paciente.telefone || 'N/A')}
                </a>
            </td>
            <td>
                ${formatarData(paciente.dataNascimento)}
            </td>
            <td>
                ${paciente.genero === 'M' ? '👨 Masculino' : paciente.genero === 'F' ? '👩 Feminino' : '⚪ Outro'}
            </td>
            <td>
                <span class="${paciente.ativo ? 'status-ativo' : 'status-inativo'}">
                    ${paciente.ativo ? '✓ Ativo' : '✗ Inativo'}
                </span>
            </td>
            <td>
                <div class="acoes">
                    <button class="btn btn-sm btn-info" onclick="verDetalhes('${paciente._id}')">
                        👁️ Ver
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Atualizar estatísticas
 */
function atualizarEstatisticas() {
    const total = pacientes.length;
    const ativos = pacientes.filter(p => p.ativo).length;
    
    document.getElementById('totalPacientes').textContent = total;
    document.getElementById('pacientesAtivos').textContent = ativos;
}

/**
 * Ver detalhes completos do paciente
 */
function verDetalhes(id) {
    const paciente = pacientes.find(p => p._id === id);
    
    if (!paciente) return;
    
    const idadeAtual = calcularIdade(paciente.dataNascimento);
    
    const html = `
        <div class="detalhe-grupo">
            <div class="detalhe-label">Nome Completo</div>
            <div class="detalhe-valor">${paciente.nome}</div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">CPF</div>
            <div class="detalhe-valor">${formatarCPF(paciente.cpf)}</div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">Email</div>
            <div class="detalhe-valor">
                <a href="mailto:${paciente.email}" style="color: #3498db; text-decoration: none;">
                    ${paciente.email}
                </a>
            </div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">Telefone</div>
            <div class="detalhe-valor">
                <a href="tel:${paciente.telefone}" style="color: #3498db; text-decoration: none;">
                    ${formatarTelefone(paciente.telefone)}
                </a>
            </div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">Data de Nascimento / Idade</div>
            <div class="detalhe-valor">
                ${formatarData(paciente.dataNascimento)} (${idadeAtual} anos)
            </div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">Gênero</div>
            <div class="detalhe-valor">
                ${paciente.genero === 'M' ? '👨 Masculino' : paciente.genero === 'F' ? '👩 Feminino' : '⚪ Outro'}
            </div>
        </div>
        
        <div class="detalhe-grupo">
            <div class="detalhe-label">Status</div>
            <div class="detalhe-valor">
                <span class="${paciente.ativo ? 'status-ativo' : 'status-inativo'}">
                    ${paciente.ativo ? '✓ Ativo' : '✗ Inativo'}
                </span>
            </div>
        </div>
        
        ${paciente.endereco ? `
            <div class="detalhe-secao">
                <h3>📍 Endereço</h3>
                <div class="detalhe-grupo">
                    <div class="detalhe-valor">
                        ${paciente.endereco.rua || 'N/A'}, ${paciente.endereco.numero || 'N/A'}
                        ${paciente.endereco.complemento ? `- ${paciente.endereco.complemento}` : ''}
                        <br/>
                        ${paciente.endereco.bairro || 'N/A'} - ${paciente.endereco.cidade || 'N/A'}, ${paciente.endereco.estado || 'N/A'}
                        <br/>
                        CEP: ${paciente.endereco.cep || 'N/A'}
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${paciente.historicoMedico && (paciente.historicoMedico.alergias?.length || paciente.historicoMedico.doencas?.length || paciente.historicoMedico.medicamentos?.length) ? `
            <div class="detalhe-secao">
                <h3>🏥 Histórico Médico</h3>
                ${paciente.historicoMedico.alergias?.length ? `
                    <div class="detalhe-grupo">
                        <div class="detalhe-label">Alergias</div>
                        <div class="detalhe-valor">${paciente.historicoMedico.alergias.join(', ')}</div>
                    </div>
                ` : ''}
                ${paciente.historicoMedico.doencas?.length ? `
                    <div class="detalhe-grupo">
                        <div class="detalhe-label">Doenças</div>
                        <div class="detalhe-valor">${paciente.historicoMedico.doencas.join(', ')}</div>
                    </div>
                ` : ''}
                ${paciente.historicoMedico.medicamentos?.length ? `
                    <div class="detalhe-grupo">
                        <div class="detalhe-label">Medicamentos</div>
                        <div class="detalhe-valor">${paciente.historicoMedico.medicamentos.join(', ')}</div>
                    </div>
                ` : ''}
                ${paciente.historicoMedico.cirurgias?.length ? `
                    <div class="detalhe-grupo">
                        <div class="detalhe-label">Cirurgias</div>
                        <div class="detalhe-valor">${paciente.historicoMedico.cirurgias.join(', ')}</div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        ${paciente.contatos?.length ? `
            <div class="detalhe-secao">
                <h3>📞 Contatos de Emergência</h3>
                ${paciente.contatos.map((contato, i) => `
                    <div class="detalhe-grupo">
                        <div class="detalhe-label">${contato.tipo || 'Contato'} ${i + 1}</div>
                        <div class="detalhe-valor">
                            ${contato.nome} - ${formatarTelefone(contato.telefone)}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="detalhe-secao">
            <div class="detalhe-label">Data de Cadastro</div>
            <div class="detalhe-valor">${formatarDataHora(paciente.dataCriacao)}</div>
        </div>
        
        ${paciente.dataAtualizacao && paciente.dataAtualizacao !== paciente.dataCriacao ? `
            <div class="detalhe-grupo">
                <div class="detalhe-label">Última Atualização</div>
                <div class="detalhe-valor">${formatarDataHora(paciente.dataAtualizacao)}</div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('conteudoModal').innerHTML = html;
    document.getElementById('modalDetalhes').classList.add('ativo');
}

/**
 * Fechar modal
 */
function fecharModal() {
    document.getElementById('modalDetalhes').classList.remove('ativo');
    document.getElementById('conteudoModal').innerHTML = '';
}

/**
 * Mostrar/ocultar carregando
 */
function mostrarCarregando(show) {
    const linha = document.querySelector('.tabela-pacientes tbody tr.carregando');
    if (linha) {
        linha.style.display = show ? 'table-row' : 'none';
    }
}

/**
 * Mostrar aviso
 */
function mostrarAviso(tipoId, mensagem) {
    const ids = ['aviso-warning', 'aviso-error', 'aviso-success'];
    
    // Ocultar todos
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Mostrar o específico
    const aviso = document.getElementById(tipoId);
    if (aviso) {
        aviso.textContent = mensagem;
        aviso.style.display = 'block';
    }
}

/* ========== FUNÇÕES UTILITÁRIAS ========== */

/**
 * Formatar CPF
 */
function formatarCPF(cpf) {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formatar Telefone
 */
function formatarTelefone(telefone) {
    if (!telefone) return 'N/A';
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

/**
 * Formatar Data
 */
function formatarData(data) {
    if (!data) return 'N/A';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Formatar Data com Hora
 */
function formatarDataHora(data) {
    if (!data) return 'N/A';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calcular idade
 */
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return 'N/A';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}
