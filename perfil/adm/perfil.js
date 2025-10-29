document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuario || usuario.tipo !== 'adm') {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = '../../login/login.html';
        return;
    }

    document.getElementById('nome').textContent = usuario.nome || 'Administrador';
    document.getElementById('email').textContent = usuario.email || '—';
    document.getElementById('nivel').textContent = usuario.nivel || 'Administrador';

    // Último login (simulado)
    const ultimo = new Date().toLocaleString('pt-BR');
    document.getElementById('ultimoLogin').textContent = ultimo;
});

function editarPerfil() {
    alert('Funcionalidade de edição em desenvolvimento.');
}