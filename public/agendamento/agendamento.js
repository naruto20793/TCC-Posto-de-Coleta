document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const medicos = await API.all("/medicos");
    const services = await API.all("/servicos");
    const specialties = await API.all("/especialidades");
    const pacientes =
      user.role === "paciente" ? [] : await API.all("/pacientes");
    const activePatients = pacientes.filter((p) => p.ativo !== false);
    UI.page(
      "Novo agendamento",
      `<div class="card"><div class="card-body"><p class="alert alert-info">Atendimento gratuito pelo SUS. Confira com a unidade os documentos, o preparo e a necessidade de encaminhamento.</p><form id="booking" class="row g-3"><div class="col-md-6"><label class="form-label" for="servico">Serviço</label><select class="form-select" id="servico" name="servico">${UI.option("", "Atendimento sem serviço específico")}${services.map((s) => UI.option(s._id, s.nome)).join("")}</select></div><div class="col-md-6"><label class="form-label" for="especialidade">Especialidade</label><select class="form-select" id="especialidade" name="especialidade">${UI.option("", "Selecione")}${specialties.map((s) => UI.option(s._id, s.nome)).join("")}</select></div><p id="orientacoes" class="pre-wrap"></p>${user.role !== "paciente" ? `<div class="col-md-6"><label class="form-label" for="busca-paciente">Buscar paciente por nome ou CPF</label><input class="form-control mb-2" id="busca-paciente" type="search" placeholder="Digite nome ou CPF" autocomplete="off"><label class="form-label" for="paciente">Paciente que fará a consulta</label><select class="form-select" id="paciente" name="paciente" required>${UI.option("", "Selecione")}${activePatients.map((p) => UI.option(p._id, `${p.nome}${p.cpf ? ` • CPF final ${p.cpf.slice(-4)}` : ""}`)).join("")}</select></div>` : ""}<div class="col-md-6"><label class="form-label" for="medico">Profissional</label><select class="form-select" name="medico" id="medico" required>${UI.option("", "Selecione")}${medicos
        .filter((m) => user.role !== "medico" || m._id === user.perfil.id)
        .map((m) => UI.option(m._id, `${m.nome} • ${m.crm}`))
        .join(
          "",
        )}</select></div>${UI.input("data", "Data", "date", "required")}<div class="col-md-6"><label class="form-label" for="hora">Horário disponível</label><select class="form-select" name="hora" id="hora" required disabled>${UI.option("", "Selecione profissional e data")}</select></div><div class="col-12"><label class="form-label" for="observacoes">Observações</label><textarea class="form-control" name="observacoes" id="observacoes" maxlength="2000"></textarea></div><div class="col-12"><p class="text-muted small">Atendimentos de 30 minutos. Horários da unidade em Araranguá (Brasília).</p><button type="submit" class="btn btn-primary">Confirmar agendamento</button></div></form></div></div>`,
    );
    const form = document.getElementById("booking");
    const search = document.getElementById("busca-paciente");
    search?.addEventListener("input", () => {
      const select = document.getElementById("paciente");
      const selected = select.value;
      const term = search.value.trim().toLocaleLowerCase("pt-BR");
      const digits = term.replace(/\D/g, "");
      const matches = activePatients.filter(
        (p) =>
          p.nome.toLocaleLowerCase("pt-BR").includes(term) ||
          (digits && p.cpf?.includes(digits)),
      );
      select.innerHTML =
        UI.option(
          "",
          matches.length ? "Selecione" : "Nenhum paciente encontrado",
        ) +
        matches
          .map((p) =>
            UI.option(
              p._id,
              `${p.nome}${p.cpf ? ` • CPF final ${p.cpf.slice(-4)}` : ""}`,
            ),
          )
          .join("");
      if (matches.some((p) => p._id === selected)) select.value = selected;
    });
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
    const service = document.getElementById("servico");
    const specialty = document.getElementById("especialidade");
    const refId = (value) => value?._id || value;
    function filterDoctors() {
      doctor.innerHTML =
        UI.option("", "Selecione") +
        medicos
          .filter(
            (m) =>
              (user.role !== "medico" || m._id === user.perfil.id) &&
              (!specialty.value ||
                m.especialidades.some((e) => refId(e) === specialty.value)),
          )
          .map((m) => UI.option(m._id, `${m.nome} • ${m.crm}`))
          .join("");
      available();
    }
    function chooseService() {
      const selected = services.find((s) => s._id === service.value);
      specialty.value = refId(selected?.especialidade) || "";
      specialty.disabled = Boolean(selected?.especialidade);
      document.getElementById("orientacoes").textContent =
        selected?.orientacoes || "";
      filterDoctors();
    }
    service.addEventListener("change", chooseService);
    specialty.addEventListener("change", filterDoctors);
    const requestedService = new URLSearchParams(location.search).get(
      "servico",
    );
    if (services.some((s) => s._id === requestedService)) {
      service.value = requestedService;
      chooseService();
    }
    const requestedDoctor = new URLSearchParams(location.search).get("medico");
    if (Array.from(doctor.options).some((o) => o.value === requestedDoctor))
      doctor.value = requestedDoctor;
    day.addEventListener("change", available);
    doctor.addEventListener("change", available);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        if (!time.value || time.disabled)
          throw new Error("Selecione um horário disponível.");
        const data = Object.fromEntries(new FormData(form));
        if (specialty.value) data.especialidade = specialty.value;
        else delete data.especialidade;
        if (!data.servico) delete data.servico;
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
