document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuario || usuario.tipo !== 'medico') {
        alert('Acesso negado. Faça login como médico.');
        window.location.href = '../../login/login.html';
        return;
    }

    document.getElementById('nome').textContent = usuario.nome || 'Médico';
    document.getElementById('email').textContent = usuario.email || '—';
    document.getElementById('crm').textContent = usuario.crm || 'Não informado';
    document.getElementById('especialidade').textContent = usuario.especialidade || 'Não informada';
    document.getElementById('telefone').textContent = usuario.telefone || 'Não informado';
});

function editarPerfil() {
    alert('Funcionalidade de edição em desenvolvimento.');
}