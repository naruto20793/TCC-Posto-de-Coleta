document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    if (!(await API.require())) return;
    const doctors = await API.all("/medicos");
    UI.page(
      "Profissionais",
      `${API.admin ? '<a class="btn btn-primary mb-3" href="/cadastro/medico/medico.html">Cadastrar profissional</a>' : ""}<div class="row g-3">${doctors.length ? doctors.map((m) => `<div class="col-md-6"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.escape(m.nome)}</h2><p>CRM: ${UI.escape(m.crm)}</p><p>${UI.escape(m.especialidades.map((e) => e.nome).join(", "))}</p><a class="btn btn-outline-primary" href="/agendamento/agendamento.html">Agendar</a></div></div></div>`).join("") : "<p>Nenhum profissional cadastrado.</p>"}</div>`,
    );
  }),
);
