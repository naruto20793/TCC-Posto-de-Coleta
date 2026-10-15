document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    if (!(await API.require(["admin", "super_admin", "medico"]))) return;
    const patients = await API.all("/pacientes");
    UI.page(
      "Pacientes",
      `${API.admin ? "" : "<p>Pacientes vinculados aos seus atendimentos.</p>"}
      <div class="row g-3 align-items-center mb-4">
        <div class="col-12 col-md-auto">
          <label for="search" class="form-label fw-bold fs-5 mb-0">Buscar por nome</label>
        </div>
        <div class="col-12 col-md">
          <input id="search" class="form-control" type="search" aria-label="Buscar por nome">
        </div>
        ${API.admin ? '<div class="col-12 col-md-auto"><a class="btn btn-primary d-inline-flex align-items-center justify-content-center text-nowrap" href="/cadastro/paciente/paciente.html">Cadastrar paciente</a></div>' : ""}
      </div>
      <div id="patients"></div>`,
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
