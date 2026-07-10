/* ========================================
   login.js - COMPLETO COM DADOS DE TESTE
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    // 1. INJETA USUÁRIOS DE TESTE (SE NÃO EXISTIREM)
    inicializarUsuariosTeste();

    // 2. ADICIONA EVENTOS AOS FORMULÁRIOS
    document.getElementById('formPaciente').addEventListener('submit', (e) => validarLogin(e, 'paciente'));
    document.getElementById('formMedico').addEventListener('submit', (e) => validarLogin(e, 'medico'));
    document.getElementById('formAdm').addEventListener('submit', (e) => validarLogin(e, 'adm'));
});

/* ========================================
   INICIALIZA USUÁRIOS DE TESTE
   ======================================== */
function inicializarUsuariosTeste() {
    const usuariosTeste = [
        { tipo: 'paciente', nome: 'João Silva', email: 'joao@email.com', senha: '123456' },
        { tipo: 'medico', nome: 'Dra. Ana Costa', email: 'ana.costa@clinica.com', senha: '123456' },
        { tipo: 'adm', nome: 'Administrador', email: 'admin', senha: 'admin123' }
    ];

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');

    // Só adiciona se não existirem
    usuariosTeste.forEach(usuarioTeste => {
        const existe = usuarios.some(u => u.email === usuarioTeste.email && u.tipo === usuarioTeste.tipo);
        if (!existe) {
            usuarios.push(usuarioTeste);
        }
    });

    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

/* ========================================
   VALIDAÇÃO DE LOGIN
   ======================================== */
function validarLogin(e, tipo) {
    e.preventDefault();

    let email, senha, usuarioAdm;

    if (tipo === 'paciente') {
        email = document.getElementById('emailPaciente').value.trim();
        senha = document.getElementById('senhaPaciente').value;
    } else if (tipo === 'medico') {
        email = document.getElementById('emailMedico').value.trim();
        senha = document.getElementById('senhaMedico').value;
    } else if (tipo === 'adm') {
        usuarioAdm = document.getElementById('usuarioAdm').value.trim();
        senha = document.getElementById('senhaAdm').value;
        email = usuarioAdm;
    }

    if (!email || !senha) {
        mostrarMensagem('Preencha todos os campos.', 'danger');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const usuario = usuarios.find(u => {
        if (tipo === 'adm') {
            return u.tipo === 'adm' && u.email === email && u.senha === senha;
        }
        return u.tipo === tipo && u.email === email && u.senha === senha;
    });

    if (usuario) {
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        mostrarMensagem(`Bem-vindo, ${usuario.nome}!`, 'success');

        setTimeout(() => {
            if (tipo === 'adm') {
                window.location.href = '../index.html';
            } else if (tipo === 'medico') {
                window.location.href = '../index.html';
            } else {
                window.location.href = '../index.html';
            }
        }, 1500);
    } else {
        mostrarMensagem('Credenciais inválidas!', 'danger');
        limparCampos(tipo);
    }
}

/* ========================================
   MOSTRAR MENSAGEM
   ======================================== */
function mostrarMensagem(texto, tipo) {
    const erro = document.getElementById('mensagemErro');
    const sucesso = document.getElementById('mensagemSucesso');
    const textoErro = document.getElementById('textoErro');
    const textoSucesso = document.getElementById('textoSucesso');

    erro.classList.add('d-none');
    sucesso.classList.add('d-none');

    if (tipo === 'danger') {
        textoErro.textContent = texto;
        erro.classList.remove('d-none');
    } else {
        textoSucesso.textContent = texto;
        sucesso.classList.remove('d-none');
    }

    setTimeout(() => {
        erro.classList.add('d-none');
        sucesso.classList.add('d-none');
    }, 5000);
}

/* ========================================
   LIMPAR CAMPOS
   ======================================== */
function limparCampos(tipo) {
    if (tipo === 'paciente') {
        document.getElementById('emailPaciente').value = '';
        document.getElementById('senhaPaciente').value = '';
        document.getElementById('emailPaciente').focus();
    } else if (tipo === 'medico') {
        document.getElementById('emailMedico').value = '';
        document.getElementById('senhaMedico').value = '';
        document.getElementById('emailMedico').focus();
    } else if (tipo === 'adm') {
        document.getElementById('usuarioAdm').value = '';
        document.getElementById('senhaAdm').value = '';
        document.getElementById('usuarioAdm').focus();
    }
}

/* ========================================
   ESQUECI A SENHA
   ======================================== */
function esqueciSenha(tipo) {
    alert(`Recuperação de senha para ${tipo} em desenvolvimento.\nUse os dados de teste abaixo.`);
}