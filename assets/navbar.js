// assets/navbar.js - Navbar compacta com hamburger toggle (sem imagens, corrigido estilo)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧭 Navbar compacta inicializada');
    injetarNavbar();
    configurarNavbar();
});

function getNivelPastaAtual() {
    const caminho = window.location.pathname;
    const niveis = (caminho.match(/\//g) || []).length - 1;
    let prefixo = '';
    for (let i = 0; i < niveis; i++) {
        prefixo += '../';
    }
    return niveis > 0 ? prefixo : './';
}

function injetarNavbar() {
    const todasNavbars = document.querySelectorAll('nav, .navbar, [class*="navbar"]');
    todasNavbars.forEach(elemento => {
        if (elemento.id !== 'navbarPrincipal') {
            elemento.remove();
        }
    });

    const prefixo = getNivelPastaAtual();

    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark fixed-top bg-gradient-primary shadow-lg navbar-compact" id="navbarPrincipal" style="border: none; outline: none;">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold fs-4" href="${prefixo}index.html">
                    <i class="fas fa-hospital me-2"></i> Posto de Coleta Araranguá
                </a>

                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item"><a class="nav-link" href="${prefixo}agendamento/agendamento.html"><i class="fas fa-calendar-check me-1"></i> Agendar</a></li>
                        <li class="nav-item"><a class="nav-link" href="${prefixo}servicos/servicos.html"><i class="fas fa-list-ul me-1"></i> Serviços</a></li>
                        <li class="nav-item"><a class="nav-link" href="${prefixo}profissionais/profissionais.html"><i class="fas fa-users me-1"></i> Profissionais</a></li>
                        <li class="nav-item"><a class="nav-link" href="${prefixo}localizacao/localizacao.html"><i class="fas fa-map-marker-alt me-1"></i> Localização</a></li>
                        <li class="nav-item d-none" id="navLaudos"><a class="nav-link" href="${prefixo}laudo/laudo.html"><i class="fas fa-file-medical me-1"></i> Laudos</a></li>
                    </ul>
                    <form class="d-flex me-3 d-none d-lg-flex">
                        <div class="input-group input-group-sm">
                            <input class="form-control" type="search" placeholder="Buscar...">
                            <button class="btn btn-outline-light" type="submit"><i class="fas fa-search"></i></button>
                        </div>
                    </form>
                </div>

                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item dropdown me-0 pe-0">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" style="outline: none;">
                            <i class="fas fa-user-circle me-1"></i>
                            <span id="navUserName" class="d-none d-md-inline">Convidado</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li id="navLoginItem"><a class="dropdown-item" href="${prefixo}login/login.html"><i class="fas fa-sign-in-alt me-2"></i> Entrar</a></li>
                            <li id="navCadastroItem" class="d-none"><a class="dropdown-item" href="${prefixo}cadastro/paciente/paciente.html"><i class="fas fa-user-plus me-2"></i> Cadastrar Paciente</a></li>
                            <li id="navCadastroMedicoItem" class="d-none"><a class="dropdown-item" href="${prefixo}cadastro/medico/medico.html"><i class="fas fa-user-md me-2"></i> Cadastrar Médico</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li id="navPerfilItem" class="d-none"><a class="dropdown-item" href="#" id="navPerfilLink"><i class="fas fa-user me-2"></i> Perfil</a></li>
                            <li id="navLogoutItem" class="d-none"><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Sair</a></li>
                        </ul>
                    </li>
                    <li class="nav-item ms-1">
                        <button class="hamburger-btn" type="button" onclick="toggleNavbar()" title="Abrir menu">
                            <i class="fas fa-bars"></i>
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

function toggleNavbar() {
    const navbar = document.getElementById('navbarPrincipal');
    navbar.classList.toggle('navbar-expanded');
}

function configurarNavbar() {
    const user = getCurrentUser();
    const navUserName = document.getElementById('navUserName');
    const navLoginItem = document.getElementById('navLoginItem');
    const navCadastroItem = document.getElementById('navCadastroItem');
    const navCadastroMedicoItem = document.getElementById('navCadastroMedicoItem');
    const navPerfilItem = document.getElementById('navPerfilItem');
    const navPerfilLink = document.getElementById('navPerfilLink');
    const navLogoutItem = document.getElementById('navLogoutItem');
    const navLaudos = document.getElementById('navLaudos');

    if (user) {
        navUserName.textContent = user.dados.nome || user.dados.email;
        navUserName.classList.remove('d-none');
        navLoginItem.style.display = 'none';
        navCadastroItem.classList.toggle('d-none', user.tipo !== 'adm');
        navCadastroMedicoItem.classList.toggle('d-none', user.tipo !== 'adm');
        navPerfilItem.classList.remove('d-none');
        navLogoutItem.classList.remove('d-none');
        // Define o link do perfil dinamicamente com fallback
        if (navPerfilLink) {
            navPerfilLink.href = `${getNivelPastaAtual()}perfil/${user.tipo ? user.tipo.toLowerCase() : 'paciente'}/perfil.html`;
        }
        if (user.tipo === 'paciente') {
            navLaudos.classList.remove('d-none');
        }
    } else {
        navUserName.textContent = 'Convidado';
        navUserName.classList.add('d-none');
        navLoginItem.style.display = 'block';
        navCadastroItem.classList.add('d-none');
        navCadastroMedicoItem.classList.add('d-none');
        navPerfilItem.classList.add('d-none');
        navLogoutItem.classList.add('d-none');
        navLaudos.classList.add('d-none');
    }
}

window.logout = function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '../../index.html';
};

window.injetarNavbar = injetarNavbar;
window.configurarNavbar = configurarNavbar;
window.toggleNavbar = toggleNavbar;