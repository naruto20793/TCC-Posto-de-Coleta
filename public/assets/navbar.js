document.addEventListener("DOMContentLoaded", () => {
  const user = API.user;
  const items = [
    ["/index/index.html", "Início"],
    ["/servicos/servicos.html", "Serviços"],
  ];
  if (user) {
    items.push(
      ["/agendamento/agendamento.html", "Agendar"],
      ["/consultas/consultas.html", "Consultas"],
      ["/laudo/laudo.html", "Laudos"],
      ["/profissionais/profissionais.html", "Profissionais"],
    );
    if (API.admin || user.role === "medico")
      items.push(["/consultas/pacientes.html", "Pacientes"]);
    if (API.admin) items.push(["/perfil/adm/perfil.html", "Administração"]);
    const profile =
      user.role === "medico"
        ? "médico"
        : user.role === "paciente"
          ? "paciente"
          : "adm";
    items.push([`/perfil/${profile}/perfil.html`, "Meu perfil"]);
  }
  const holder = document.getElementById("navbarPlaceholder");
  if (!holder) return;
  holder.innerHTML = `<nav class="navbar navbar-expand-xl navbar-dark bg-primary" aria-label="Navegação principal"><div class="container"><a class="navbar-brand" href="/index/index.html">Posto de Coleta</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navigation" aria-controls="navigation" aria-expanded="false" aria-label="Abrir menu"><span class="navbar-toggler-icon"></span></button><div id="navigation" class="collapse navbar-collapse"><ul class="navbar-nav me-auto">${items.map(([url, label]) => `<li class="nav-item"><a class="nav-link" href="${url}">${label}</a></li>`).join("")}</ul>${user ? '<button id="logout" class="btn btn-outline-light">Sair</button>' : '<a class="btn btn-outline-light" href="/login/login.html">Entrar</a>'}</div></div></nav>`;
  document
    .getElementById("logout")
    ?.addEventListener("click", () => API.logout());
});
