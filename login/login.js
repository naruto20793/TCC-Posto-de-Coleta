document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');

    // Foco no campo de email ao carregar
    emailInput.focus();

    // Validação em tempo real
    emailInput.addEventListener('input', validarEmail);
    senhaInput.addEventListener('input', validarSenha);

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        if (!validarEmail() || !validarSenha()) {
            mostrarToast('Preencha todos os campos corretamente.', 'warning');
            return;
        }

        // Busca usuário no localStorage
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email && u.senha === senha);

        if (usuario) {
            // Login bem-sucedido
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            mostrarToast(`Bem-vindo, ${usuario.nome || 'Usuário'}!`, 'success');

            // Redireciona com base no tipo
            setTimeout(() => {
                if (usuario.tipo === 'adm') {
                    window.location.href = '../perfil/adm/perfil.html';
                } else if (usuario.tipo === 'medico') {
                    window.location.href = '../perfil/medico/perfil.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 1500);
        } else {
            mostrarToast('Email ou senha incorretos.', 'danger');
            senhaInput.value = '';
            senhaInput.focus();
        }
    });
});

/* ========================================
   VALIDAÇÃO DE EMAIL
   ======================================== */
function validarEmail() {
    const email = document.getElementById('email').value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);

    toggleValidacao('email', isValid);
    return isValid;
}

/* ========================================
   VALIDAÇÃO DE SENHA
   ======================================== */
function validarSenha() {
    const senha = document.getElementById('senha').value;
    const isValid = senha.length >= 6;

    toggleValidacao('senha', isValid);
    return isValid;
}

/* ========================================
   MARCAÇÃO VISUAL DE VALIDAÇÃO
   ======================================== */
function toggleValidacao(campo, valido) {
    const input = document.getElementById(campo);
    const grupo = input.parentElement;

    if (valido) {
        grupo.classList.remove('is-invalid');
        grupo.classList.add('is-valid');
    } else {
        grupo.classList.remove('is-valid');
        grupo.classList.add('is-invalid');
    }
}

/* ========================================
   TOAST REUTILIZÁVEL
   ======================================== */
function mostrarToast(mensagem, tipo = 'info') {
    const toastEl = document.getElementById('toast');
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensagem}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}