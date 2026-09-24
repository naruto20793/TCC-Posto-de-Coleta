document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const medicos = await API.all("/medicos");
    const pacientes =
      user.role === "paciente" ? [] : await API.all("/pacientes");
    UI.page(
      "Novo agendamento",
      `<div class="card"><div class="card-body"><form id="booking" class="row g-3">${user.role !== "paciente" ? `<div class="col-md-6"><label class="form-label" for="paciente">Paciente</label><select class="form-select" id="paciente" name="paciente" required>${UI.option("", "Selecione")}${pacientes.map((p) => UI.option(p._id, p.nome)).join("")}</select></div>` : ""}<div class="col-md-6"><label class="form-label" for="medico">Profissional</label><select class="form-select" name="medico" id="medico" required>${UI.option("", "Selecione")}${medicos
        .filter((m) => user.role !== "medico" || m._id === user.perfil.id)
        .map((m) => UI.option(m._id, `${m.nome} • ${m.crm}`))
        .join(
          "",
        )}</select></div>${UI.input("data", "Data", "date", "required")}<div class="col-md-6"><label class="form-label" for="hora">Horário disponível</label><select class="form-select" name="hora" id="hora" required disabled>${UI.option("", "Selecione profissional e data")}</select></div><div class="col-12"><label class="form-label" for="observacoes">Observações</label><textarea class="form-control" name="observacoes" id="observacoes" maxlength="2000"></textarea></div><div class="col-12"><p class="text-muted small">Atendimentos de 30 minutos. Horários da unidade em Araranguá (Brasília).</p><button type="submit" class="btn btn-primary">Confirmar agendamento</button></div></form></div></div>`,
    );
    const form = document.getElementById("booking");
    const day = document.getElementById("data");
    const doctor = document.getElementById("medico");
    const time = document.getElementById("hora");
    day.min = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    let request = 0;
    async function available() {
      const current = ++request;
      time.disabled = true;
      time.innerHTML = UI.option("", "Carregando horários…");
      if (!day.value || !doctor.value) {
        time.innerHTML = UI.option("", "Selecione profissional e data");
        return;
      }
      try {
        const data = await API.request(
          `/agendamentos/disponibilidade?medico=${encodeURIComponent(doctor.value)}&data=${encodeURIComponent(day.value)}`,
        );
        if (current !== request) return;
        time.innerHTML =
          UI.option(
            "",
            data.horarios.length ? "Selecione" : "Nenhum horário disponível",
          ) + data.horarios.map((h) => UI.option(h, h)).join("");
        time.disabled = !data.horarios.length;
      } catch (error) {
        if (current === request) {
          time.innerHTML = UI.option("", "Não foi possível consultar");
          UI.message(error.message);
        }
      }
    }
    day.addEventListener("change", available);
    doctor.addEventListener("change", available);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        if (!time.value || time.disabled)
          throw new Error("Selecione um horário disponível.");
        const data = Object.fromEntries(new FormData(form));
        const selected = medicos.find((m) => m._id === data.medico);
        if (selected?.especialidades?.[0])
          data.especialidade =
            selected.especialidades[0]._id || selected.especialidades[0];
        try {
          await API.request("/agendamentos", {
            method: "POST",
            body: JSON.stringify(data),
          });
          location.href = "/consultas/consultas.html";
        } catch (error) {
          await available();
          throw error;
        }
      });
    });
  }),
);
