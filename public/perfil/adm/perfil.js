let usuarioOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario || usuario.tipo !== 'adm') {
        alert('Acesso negado.');
        window.location.href = '../../login/login.html';
        return;
    }

    usuarioOriginal = { ...usuario };

    document.getElementById('nome').textContent = usuario.nome || 'Administrador';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('nivel').value = usuario.nivel || 'Administrador';

    // Último login
    document.getElementById('ultimoLogin').textContent = new Date().toLocaleString('pt-BR');
});

document.getElementById('formPerfil').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarToast('Email inválido.', 'danger');
        return;
    }

    const usuarioAtualizado = {
        ...usuarioOriginal,
        email,
        nivel: document.getElementById('nivel').value
    };

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const index = usuarios.findIndex(u => u.email === usuarioOriginal.email && u.tipo === 'adm');
    if (index !== -1) usuarios[index] = usuarioAtualizado;

    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

    mostrarToast('Perfil atualizado!', 'success');
    setTimeout(() => location.reload(), 1500);
});

function cancelarEdicao() {
    if (confirm('Descartar alterações?')) location.reload();
}

function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById('toastContent');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.querySelector('.toast-body').textContent = mensagem;
    new bootstrap.Toast(toast).show();
}