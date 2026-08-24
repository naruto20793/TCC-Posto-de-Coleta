document.addEventListener('DOMContentLoaded', function () {
    injetarNavbar();
    configurarNavbar();
    destacarPaginaAtual();
});

/* ========================================
   1. Retorna o caminho raiz (absoluto)
   ======================================== */
function getNivelPastaAtual() {
    // Usa caminhos absolutos (raiz-relativos) para funcionar com servidor Express
    return '/';
}

/* ========================================
   2. Injeta a navbar completa
   ======================================== */
function injetarNavbar() {
    document.querySelectorAll('body > nav:not(#navbarPrincipal), body > .navbar:not(#navbarPrincipal)').forEach(navbar => navbar.remove());
    if (document.getElementById('navbarPrincipal')) return;

    const prefixo = getNivelPastaAtual();

    const navbarHTML = `
        <nav class="navbar navbar-expand-xl navbar-dark bg-primary shadow-sm fixed-top" id="navbarPrincipal">
            <div class="container-fluid">
                <!-- Logo -->
                <a class="navbar-brand fw-bold d-flex align-items-center" href="${prefixo}index/index.html">
                     Posto Araranguá
                </a>

                <!-- Botão mobile -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    Menu
                </button>

                <!-- Menu principal -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}index/index.html" data-page="index.html">
                                 Início
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}agendamento/agendamento.html" data-page="agendamento.html">
                                 Agendar
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link link-pacientes" href="${prefixo}consultas/pacientes.html" data-page="pacientes.html">
                                 Pacientes
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}consultas/consultas.html" data-page="consultas.html">
                                 Consultas
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}laudo/laudo.html" data-page="laudo.html">
                                 Laudos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}localizacao/localizacao.html" data-page="localizacao.html">
                                 Local
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}profissionais/profissionais.html" data-page="profissionais.html">
                                 Profissionais
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}servicos/servicos.html" data-page="servicos.html">
                                 Serviços
                            </a>
                        </li>
                    </ul>

                    <!-- Área de usuário (login / perfil) -->
                    <ul class="navbar-nav ms-auto" id="userMenu">
                        <!-- Será preenchido dinamicamente -->
                    </ul>
                </div>
            </div>
        </nav>
    `;

    // Insere no início do body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

/* ========================================
   3. Configura login, cadastro e perfil
   ======================================== */
function configurarNavbar() {
    let usuarioLogado = null;
    try {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioAtual'));
    } catch (error) {
        usuarioLogado = null;
    }
    const userMenu = document.getElementById('userMenu');
    const prefixo = getNivelPastaAtual();
    const linkPacientes = document.querySelector('.link-pacientes')?.closest('.nav-item');
    const tipoUsuario = usuarioLogado?.tipo || usuarioLogado?.role;
    const podeVerPacientes = ['admin', 'adm', 'super_admin', 'medico'].includes(tipoUsuario);

    if (linkPacientes) linkPacientes.hidden = !podeVerPacientes;

    if (!userMenu) return;

    if (usuarioLogado) {
        // USUÁRIO LOGADO
        const nome = usuarioLogado.nome?.split(' ')[0] || 'Usuário';
        const tipo = usuarioLogado.tipo === 'medico' ? 'Médico' : usuarioLogado.tipo === 'adm' ? 'Admin' : 'Paciente';

        userMenu.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">

                    <span class="d-none d-md-inline">${nome} (${tipo})</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="${prefixo}perfil/${usuarioLogado.tipo}/perfil.html">
                         Meu Perfil
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutLink">
                         Sair
                    </a></li>
                </ul>
            </li>
        `;

        // Evento de logout
        document.getElementById('logoutLink')?.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('usuarioLogado');
                window.location.href = prefixo + 'index/index.html';
            }
        });

    } else {
        // NÃO LOGADO
        userMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="${prefixo}login/login.html">
                     Login
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link btn btn-outline-light ms-2 px-3" href="${prefixo}cadastro/paciente/paciente.html">
                     Cadastre-se
                </a>
            </li>
        `;
    }
}

/* ========================================
   4. Destaca a página atual (active)
   ======================================== */
function destacarPaginaAtual() {
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#navbarPrincipal .nav-link').forEach(link => {
        const dataPage = link.getAttribute('data-page');
        if (dataPage === paginaAtual) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}