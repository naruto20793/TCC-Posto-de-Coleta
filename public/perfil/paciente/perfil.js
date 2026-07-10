let usuarioOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario || usuario.tipo !== 'paciente') {
        alert('Acesso negado.');
        window.location.href = '../../login/login.html';
        return;
    }

    usuarioOriginal = { ...usuario };

    // PREENCHE CAMPOS
    const nomeElement = document.getElementById('nome');
    nomeElement.textContent = usuario.nome || 'Paciente';
    
    // FORÇA COR PRETA NO JS
    nomeElement.style.color = '#000';
    nomeElement.style.fontWeight = '700';

    document.getElementById('email').value = usuario.email || '';
    document.getElementById('cpf').value = usuario.cpf || '';
    document.getElementById('telefone').value = usuario.telefone || '';
    document.getElementById('nascimento').value = usuario.nascimento || '';

    document.getElementById('telefone').addEventListener('input', formatarTelefone);
});

document.getElementById('formPerfil').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarToast('Email inválido.', 'danger');
        return;
    }

    if (telefone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(telefone)) {
        mostrarToast('Telefone inválido.', 'danger');
        return;
    }

    // Atualiza usuário
    const usuarioAtualizado = {
        ...usuarioOriginal,
        email,
        telefone,
        nascimento: document.getElementById('nascimento').value
    };

    // Salva no localStorage
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const index = usuarios.findIndex(u => u.email === usuarioOriginal.email && u.tipo === 'paciente');
    if (index !== -1) usuarios[index] = usuarioAtualizado;

    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));

    mostrarToast('Perfil atualizado com sucesso!', 'success');
    setTimeout(() => location.reload(), 1500);
});

function cancelarEdicao() {
    if (confirm('Descartar alterações?')) {
        location.reload();
    }
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

