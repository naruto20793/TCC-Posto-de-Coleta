// cadastro/paciente/paciente.js - Lógica para cadastro de paciente (apenas para admins)
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Cadastro de paciente iniciado');
    verificarAcesso();
});

function verificarAcesso() {
    const user = getCurrentUser();
    if (!user || user.tipo !== 'adm') {
        alert('Acesso restrito. Apenas administradores podem cadastrar pacientes.');
        window.location.href = '../../index.html'; // Redireciona para a página inicial
        return;
    }
    // Se for admin, carrega o formulário (implementação do cadastro aqui)
    carregarFormulario();
}

function carregarFormulario() {
    // Simulação de formulário de cadastro (a implementar)
    const container = document.getElementById('cadastroContainer') || document.body;
    container.innerHTML = `
        <div class="container mt-5">
            <h2 class="text-center mb-4">Cadastrar Novo Paciente</h2>
            <div class="card p-4 shadow-sm">
                <form id="formCadastro">
                    <div class="mb-3">
                        <label for="nome" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="nome" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" required>
                    </div>
                    <div class="mb-3">
                        <label for="senha" class="form-label">Senha</label>
                        <input type="password" class="form-control" id="senha" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Cadastrar</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('formCadastro').addEventListener('submit', function(e) {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        // Simulação de cadastro (a implementar no database.js)
        alert(`Paciente cadastrado: ${nome}, ${email}`);
        window.location.href = '../../index.html';
    });
}