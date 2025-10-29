document.addEventListener('DOMContentLoaded', function () {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // 1. VERIFICA SE É ADMINISTRADOR
    if (!usuarioLogado || usuarioLogado.tipo !== 'adm') {
        mostrarToast('Acesso negado. Apenas administradores.', 'danger');
        setTimeout(() => {
            window.location.href = '../../login/login.html';
        }, 1800);
        return;
    }

    // 2. PREENCHE INFORMAÇÕES
    document.getElementById('nome').textContent = usuarioLogado.nome || 'Administrador';
    document.getElementById('email').textContent = usuarioLogado.email || 'N/A';
    document.getElementById('id').textContent = usuarioLogado.id || gerarID();
    document.getElementById('dataCadastro').textContent = formatarData(usuarioLogado.dataCadastro || new Date().toISOString());

    // 3. ANIMAÇÃO DE ENTRADA
    document.querySelector('.form-container').classList.add('fade-in-up');
});

/* ========================================
   GERA ID ÚNICO (se não existir)
   ======================================== */
function gerarID() {
    return 'ADM' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

/* ========================================
   FORMATA DATA
   ======================================== */
function formatarData(dataISO) {
    if (!dataISO) return 'Hoje';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
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