document.addEventListener('DOMContentLoaded', function () {
    carregarConsultasRealizadas();
});

function carregarConsultasRealizadas() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        mostrarToast('Faça login para ver suas consultas realizadas.', 'danger');
        setTimeout(() => window.location.href = 'login/login.html', 1500);
        return;
    }

    const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    const listaConsultas = document.getElementById('listaConsultasRealizadas');
    listaConsultas.innerHTML = '';

    const consultasRealizadas = agendamentos.filter(a => a.usuarioId === usuarioLogado.email && a.status === 'concluído');
    if (consultasRealizadas.length === 0) {
        listaConsultas.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma consulta realizada encontrada.</td></tr>';
        return;
    }

    consultasRealizadas.forEach((agendamento) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${agendamento.data}</td>
            <td>${agendamento.hora}</td>
            <td>${agendamento.servico}</td>
            <td>${agendamento.status}</td>
        `;
        listaConsultas.appendChild(tr);
    });
}

function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById('toast');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensagem}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}