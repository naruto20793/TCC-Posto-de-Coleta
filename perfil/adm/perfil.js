// perfil/[tipo]/perfil.js - Lógica para a tela de perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Perfil iniciado');
    carregarPerfil();
});

function carregarPerfil() {
    const user = getCurrentUser();
    if (!user) {
        alert('Faça login para acessar seu perfil.');
        window.location.href = '../../login/login.html';
        return;
    }

    const nome = document.getElementById('perfilNome');
    const email = document.getElementById('perfilEmail');
    const tipo = document.getElementById('perfilTipo');
    const id = document.getElementById('perfilId');
    const especialidade = document.getElementById('perfilEspecialidade');
    const editarBtn = document.getElementById('editarPerfilBtn');
    const gerenciarUsuariosBtn = document.getElementById('gerenciarUsuariosBtn');

    nome.textContent = user.dados.nome || 'Usuário';
    email.textContent = user.dados.email || 'Não informado';
    tipo.textContent = user.tipo || 'Usuário';
    id.textContent = user.dados.id || 'Não disponível';

    if (user.tipo === 'medico' && especialidade) {
        especialidade.textContent = user.dados.especialidade || 'Não informada';
    } else if (especialidade) {
        especialidade.style.display = 'none'; // Esconde campo se não for médico
    }

    if (gerenciarUsuariosBtn && user.tipo !== 'adm') {
        gerenciarUsuariosBtn.style.display = 'none'; // Só para admins
    }

    // Configura o botão Editar Perfil para ir para a página de edição
    if (editarBtn) {
        editarBtn.href = '../editar/editar.html';
    }

    if (gerenciarUsuariosBtn) {
        gerenciarUsuariosBtn.href = '#';
        gerenciarUsuariosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Funcionalidade de gerenciamento em desenvolvimento!');
        });
    }
}

// Usa a função logout do navbar.js
window.logout = function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../../index.html';
};