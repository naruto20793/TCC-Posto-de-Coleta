document.addEventListener('DOMContentLoaded', function () {
    injetarNavbar();
    configurarNavbar();
    destacarPaginaAtual();
});

/* ========================================
   1. Calcula o nível de pasta atual
   ======================================== */
function getNivelPastaAtual() {
    const caminho = window.location.pathname;
    const niveis = (caminho.match(/\//g) || []).length - 1;
    let prefixo = '';
    for (let i = 0; i < niveis; i++) {
        prefixo += '../';
    }
    return niveis > 0 ? prefixo : './';
}

/* ========================================
   2. Injeta a navbar completa
   ======================================== */
function injetarNavbar() {
    const prefixo = getNivelPastaAtual();

    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm fixed-top" id="navbarPrincipal">
            <div class="container-fluid">
                <!-- Logo -->
                <a class="navbar-brand fw-bold d-flex align-items-center" href="${prefixo}index.html">
                    <i class="fas fa-hospital me-2"></i> Posto Araranguá
                </a>

                <!-- Botão mobile -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <!-- Menu principal -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}index.html" data-page="index.html">
                                <i class="fas fa-home me-1"></i> Início
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}agendamento/agendamento.html" data-page="agendamento.html">
                                <i class="fas fa-calendar-plus me-1"></i> Agendar
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}consultas/consultas.html" data-page="consultas.html">
                                <i class="fas fa-stethoscope me-1"></i> Consultas
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}laudo/laudo.html" data-page="laudo.html">
                                <i class="fas fa-file-medical me-1"></i> Laudos
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}localizacao/localizacao.html" data-page="localizacao.html">
                                <i class="fas fa-map-marker-alt me-1"></i> Local
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}profissionais/profissionais.html" data-page="profissionais.html">
                                <i class="fas fa-user-md me-1"></i> Profissionais
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${prefixo}servicos/servicos.html" data-page="servicos.html">
                                <i class="fas fa-cogs me-1"></i> Serviços
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
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const userMenu = document.getElementById('userMenu');
    const prefixo = getNivelPastaAtual();

    if (!userMenu) return;

    if (usuarioLogado) {
        // USUÁRIO LOGADO
        const nome = usuarioLogado.nome?.split(' ')[0] || 'Usuário';
        const tipo = usuarioLogado.tipo === 'medico' ? 'Médico' : usuarioLogado.tipo === 'adm' ? 'Admin' : 'Paciente';

        userMenu.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i>
                    <span class="d-none d-md-inline">${nome} (${tipo})</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="${prefixo}perfil/${usuarioLogado.tipo}/perfil.html">
                        <i class="fas fa-user me-2"></i> Meu Perfil
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutLink">
                        <i class="fas fa-sign-out-alt me-2"></i> Sair
                    </a></li>
                </ul>
            </li>
        `;

        // Evento de logout
        document.getElementById('logoutLink')?.addEventListener('click', function (e) {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('usuarioLogado');
                window.location.href = prefixo + 'index.html';
            }
        });

    } else {
        // NÃO LOGADO
        userMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="${prefixo}login/login.html">
                    <i class="fas fa-sign-in-alt me-1"></i> Login
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link btn btn-outline-light ms-2 px-3" href="${prefixo}cadastro/paciente/paciente.html">
                    <i class="fas fa-user-plus me-1"></i> Cadastre-se
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