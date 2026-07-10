let usuarioOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario || usuario.tipo !== 'medico') {
        alert('Acesso negado.');
        window.location.href = '../../login/login.html';
        return;
    }

    usuarioOriginal = { ...usuario };

    document.getElementById('nome').textContent = usuario.nome || 'Médico';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('crm').value = usuario.crm || '';
    document.getElementById('especialidade').value = usuario.especialidade || '';
    document.getElementById('telefone').value = usuario.telefone || '';

    document.getElementById('telefone').addEventListener('input', formatarTelefone);
});

document.getElementById('formPerfil').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const crm = document.getElementById('crm').value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarToast('Email inválido.', 'danger');
        return;
    }
    if (!crm) {
        mostrarToast('CRM é obrigatório.', 'danger');
        return;
    }

    const usuarioAtualizado = {
        ...usuarioOriginal,
        email,
        crm,
        especialidade: document.getElementById('especialidade').value,
        telefone: document.getElementById('telefone').value
    };

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const index = usuarios.findIndex(u => u.email === usuarioOriginal.email && u.tipo === 'medico');
    if (index !== -1) usuarios[index] = usuarioAtualizado;

    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

    mostrarToast('Perfil atualizado!', 'success');
    setTimeout(() => location.reload(), 1500);
});

function cancelarEdicao() {
    if (confirm('Descartar alterações?')) location.reload();
}

function formatarTelefone(e) {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v.substring(0, 15);
}

function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById('toastContent');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.querySelector('.toast-body').textContent = mensagem;
    new bootstrap.Toast(toast).show();
}