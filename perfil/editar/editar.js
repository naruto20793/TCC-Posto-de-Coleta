// editar/editar.js - Lógica para edição de perfil com salvamento real
console.log('✏️ Iniciando edição de perfil - Tentando injetar navbar');
// Garante que a navbar seja injetada manualmente
if (typeof injetarNavbar === 'function' && typeof configurarNavbar === 'function') {
    injetarNavbar();
    configurarNavbar();
    console.log('Navbar injetada com sucesso');
} else {
    console.log('Erro: Funções injetarNavbar ou configurarNavbar não estão disponíveis');
}

function carregarEdicao() {
    const user = getCurrentUser();
    console.log('Usuário logado:', user); // Depuração
    if (!user || !user.dados) {
        alert('Faça login para editar seu perfil.');
        window.location.href = '../login/login.html';
        return;
    }

    const tipo = document.getElementById('editarTipo');
    const nome = document.getElementById('nome');
    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
    const especialidade = document.getElementById('especialidade');
    const campoEspecial = document.getElementById('campoEspecial');
    const campoAdmin = document.getElementById('campoAdmin');
    const feedback = document.createElement('div');
    feedback.id = 'feedbackMessage';
    feedback.style.display = 'none';
    feedback.className = 'alert alert-success text-center mt-3';
    document.querySelector('.card-body').appendChild(feedback);

    tipo.textContent = `Editando Perfil de ${user.tipo || 'Desconhecido'}`;
    nome.value = user.dados.nome || '';
    email.value = user.dados.email || '';
    senha.value = user.dados.senha || '';

    // Mostra campos específicos por tipo
    if (user.tipo === 'medico' && especialidade) {
        campoEspecial.classList.remove('d-none');
        especialidade.value = user.dados.especialidade || '';
    }
    if (user.tipo === 'adm' && campoAdmin) {
        campoAdmin.classList.remove('d-none');
    }

    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Tentando salvar:', { nome: nome.value, email: email.value, senha: senha.value });
        if (!nome.value.trim() || !email.value.trim() || !senha.value.trim()) {
            feedback.textContent = 'Por favor, preencha todos os campos obrigatórios.';
            feedback.style.display = 'block';
            setTimeout(() => feedback.style.display = 'none', 3000);
            return;
        }

        // Atualiza os dados do usuário
        user.dados.nome = nome.value.trim();
        user.dados.email = email.value.trim();
        user.dados.senha = senha.value.trim();
        if (user.tipo === 'medico') {
            user.dados.especialidade = especialidade.value.trim() || user.dados.especialidade;
        }

        // Salva no localStorage e verifica
        try {
            localStorage.setItem('usuarioLogado', JSON.stringify(user));
            const savedUser = JSON.parse(localStorage.getItem('usuarioLogado'));
            console.log('Dados salvos no localStorage:', savedUser);
            if (!savedUser || savedUser.dados.nome !== user.dados.nome) {
                throw new Error('Falha ao salvar os dados no localStorage.');
            }

            // Feedback de sucesso
            feedback.textContent = 'Perfil atualizado com sucesso!';
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
                const redirectPath = user.tipo ? `../perfil/${user.tipo.toLowerCase()}/perfil.html` : '../index.html';
                console.log('Redirecionando para:', redirectPath); // Depuração
                window.location.href = redirectPath;
            }, 1500);
        } catch (error) {
            feedback.textContent = 'Erro ao salvar o perfil. Tente novamente.';
            feedback.className = 'alert alert-danger text-center mt-3';
            feedback.style.display = 'block';
            console.error('Erro ao salvar:', error);
            setTimeout(() => feedback.style.display = 'none', 3000);
        }
    });
}

function cancelarEdicao() {
    const user = getCurrentUser();
    console.log('Cancelando edição - Usuário:', user); // Depuração
    if (user && user.tipo) {
        const redirectPath = `../perfil/${user.tipo.toLowerCase()}/perfil.html`;
        console.log('Redirecionando para:', redirectPath); // Depuração
        window.location.href = redirectPath;
    } else {
        window.location.href = '../index.html';
    }
}