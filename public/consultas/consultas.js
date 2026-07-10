// consultas/consultas.js - Lógica para exibir consultas agendadas e concluídas
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Consultas iniciadas - Tentando injetar navbar');
    if (typeof injetarNavbar === 'function' && typeof configurarNavbar === 'function') {
        injetarNavbar();
        configurarNavbar();
        console.log('Navbar injetada com sucesso');
    } else {
        console.log('Erro: Funções injetarNavbar ou configurarNavbar não estão disponíveis');
    }

    carregarConsultas();
});

function carregarConsultas() {
    const user = getCurrentUser();
    if (!user || !user.dados) {
        alert('Faça login para visualizar suas consultas.');
        window.location.href = '../login/login.html';
        return;
    }

    const consultas = JSON.parse(localStorage.getItem('consultas') || '[]');
    const listaAgendadas = document.getElementById('listaAgendadas');
    const listaConcluidas = document.getElementById('listaConcluidas');
    const semAgendadas = document.getElementById('semAgendadas');
    const semConcluidas = document.getElementById('semConcluidas');

    listaAgendadas.innerHTML = '';
    listaConcluidas.innerHTML = '';

    const consultasUsuario = consultas.filter(c => c.idUsuario === user.dados.id);

    if (consultasUsuario.length === 0) {
        semAgendadas.style.display = 'block';
        semConcluidas.style.display = 'block';
        return;
    }

    const agendadas = consultasUsuario.filter(c => !c.concluida);
    const concluidas = consultasUsuario.filter(c => c.concluida);

    if (agendadas.length > 0) {
        semAgendadas.style.display = 'none';
        agendadas.forEach(consulta => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${consulta.data} - ${consulta.descricao || 'Consulta'} <small class="text-muted">(${consulta.hora})</small></span>
                <span class="badge bg-primary">${consulta.medico || 'Médico'}</span>
            `;
            listaAgendadas.appendChild(item);
        });
    } else {
        semAgendadas.style.display = 'block';
    }

    if (concluidas.length > 0) {
        semConcluidas.style.display = 'none';
        concluidas.forEach(consulta => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <span>${consulta.data} - ${consulta.descricao || 'Consulta'} <small class="text-muted">(${consulta.hora})</small></span>
                <span class="badge bg-success">Concluída</span>
            `;
            listaConcluidas.appendChild(item);
        });
    } else {
        semConcluidas.style.display = 'block';
    }
}

// Exemplo: Adicione uma consulta (para teste)
function adicionarConsultaExemplo() {
    const consultas = JSON.parse(localStorage.getItem('consultas') || '[]');
    const user = getCurrentUser();
    if (user && user.dados) {
        consultas.push({
            idUsuario: user.dados.id,
            data: '10/10/2025',
            hora: '14:00',
            descricao: 'Exame de Sangue',
            medico: 'Dr. João Silva',
            concluida: false
        });
        localStorage.setItem('consultas', JSON.stringify(consultas));
        carregarConsultas();
    }
}

// Chame isso para testar (remova após testes)
adicionarConsultaExemplo();