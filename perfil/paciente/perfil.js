document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuario || usuario.tipo !== 'paciente') {
        alert('Acesso negado. Faça login como paciente.');
        window.location.href = '../../login/login.html';
        return;
    }

    document.getElementById('nome').textContent = usuario.nome || 'Paciente';
    document.getElementById('email').textContent = usuario.email || '—';
    document.getElementById('cpf').textContent = usuario.cpf || 'Não informado';
    document.getElementById('telefone').textContent = usuario.telefone || 'Não informado';
    document.getElementById('nascimento').textContent = usuario.nascimento || 'Não informado';
});

function editarPerfil() {
    alert('Funcionalidade de edição em desenvolvimento.');
}