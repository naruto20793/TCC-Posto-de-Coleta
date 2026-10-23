document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    if (!(await API.require())) return;
    const doctors = await API.all("/medicos");
    function scheduleSummary(schedule) {
      if (
        !schedule?.diasSemana?.length ||
        !schedule.horaInicio ||
        !schedule.horaFim
      )
        return '<h3 class="h6">Horários de atendimento</h3><p class="mb-0">Horário de atendimento não informado.</p>';
      return `<h3 class="h6">Horários de atendimento</h3><dl class="mb-0"><dt>Dias</dt><dd>${UI.escape(schedule.diasSemana.join(", "))}</dd><dt>Horário</dt><dd>${UI.escape(schedule.horaInicio)} às ${UI.escape(schedule.horaFim)}</dd></dl><p class="small text-muted mb-0">Horário de Brasília</p>`;
    }
    const preset = API.admin
      ? await API.request("/medicos/horario-padrao")
      : null;
    UI.page(
      "Profissionais",
      `${API.admin ? `<a class="btn btn-primary mb-3" href="/cadastro/medico/medico.html">Cadastrar profissional</a><section class="card mb-4"><div class="card-body"><h2 class="h5">Horário padrão dos médicos</h2><p>Salve o padrão para novos cadastros ou aplique o expediente a todos os médicos cadastrados.</p><form id="preset" class="row g-3">${Horarios.fields("padrao", preset)}<div class="col-12"><div class="form-check"><input id="aplicarTodos" class="form-check-input" type="checkbox"><label for="aplicarTodos" class="form-check-label">Aplicar também a todos os médicos cadastrados, substituindo seus horários</label></div></div><div class="col-12"><button class="btn btn-primary" type="submit">Salvar horário padrão</button></div></form><p class="small mt-3">Consultas já marcadas devem caber no novo expediente. Caso contrário, a alteração será bloqueada.</p></div></section>` : ""}<div class="row g-3">${doctors.length ? doctors.map((m) => `<div class="col-md-6"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.escape(m.nome)}</h2><p>CRM: ${UI.escape(m.crm)}</p><p>${UI.escape(m.especialidades.map((e) => e.nome).join(", "))}</p><section class="schedule-summary rounded border bg-light p-3 mb-3" aria-label="Horários de atendimento de ${UI.escape(m.nome)}" aria-live="polite">${scheduleSummary(m.horarioDisponivel)}</section><a class="btn btn-outline-primary" href="/agendamento/agendamento.html?medico=${encodeURIComponent(m._id)}">Agendar consulta</a>${API.admin ? `<details class="mt-3"><summary>Editar horário de atendimento</summary><form class="row g-3 mt-1 doctor-schedule" data-id="${UI.escape(m._id)}">${Horarios.fields(m._id, m.horarioDisponivel)}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar horário do médico</button></div></form></details>${Disponibilidade.form(m._id)}` : ""}</div></div></div>`).join("") : "<p>Nenhum profissional cadastrado.</p>"}</div>`,
    );
    if (API.admin) Disponibilidade.init();
    document.getElementById("preset")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      UI.submit(form, async () => {
        await API.request("/medicos/horario-padrao", {
          method: "PUT",
          body: JSON.stringify({
            horarioDisponivel: Horarios.read(form),
            aplicarTodos: document.getElementById("aplicarTodos").checked,
          }),
        });
        location.reload();
      });
    });
    document.querySelectorAll(".doctor-schedule").forEach((form) =>
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        UI.submit(form, async () => {
          const horarioDisponivel = Horarios.read(form);
          const updated = await API.request(
            `/medicos/${form.dataset.id}/horario`,
            {
              method: "PUT",
              body: JSON.stringify({ horarioDisponivel }),
            },
          );
          const schedule = updated.horarioDisponivel || horarioDisponivel;
          form
            .closest(".card-body")
            .querySelector(".schedule-summary").innerHTML =
            scheduleSummary(schedule);
          form.closest("details").open = false;
          UI.message(
            "Horário de atendimento salvo. Os novos horários já aparecem no cartão do médico.",
            "success",
          );
        });
      }),
    );
  }),
);
