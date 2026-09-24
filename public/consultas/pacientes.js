document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    if (!(await API.require(["admin", "super_admin", "medico"]))) return;
    const patients = await API.all("/pacientes");
    UI.page(
      "Pacientes",
      `${API.admin ? '<a class="btn btn-primary mb-3" href="/cadastro/paciente/paciente.html">Cadastrar paciente</a>' : "<p>Pacientes vinculados aos seus atendimentos.</p>"}<label for="search" class="form-label">Buscar por nome</label><input id="search" class="form-control mb-3" type="search"><div id="patients"></div>`,
    );
    function render(value = "") {
      const rows = patients.filter((p) =>
        p.nome.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
      );
      document.getElementById("patients").innerHTML = rows.length
        ? `<div class="table-responsive"><table class="table table-striped"><thead><tr><th>Nome</th><th>Email</th><th>Telefone</th></tr></thead><tbody>${rows.map((p) => `<tr><td>${UI.escape(p.nome)}</td><td>${UI.escape(p.email)}</td><td>${UI.escape(p.telefone)}</td></tr>`).join("")}</tbody></table></div>`
        : "<p>Nenhum paciente encontrado.</p>";
    }
    document
      .getElementById("search")
      .addEventListener("input", (e) => render(e.target.value));
    render();
  }),
);
