document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const medicos = await API.all("/medicos");
    const units = (await API.all("/unidades")).filter((u) => u.ativo);
    const services = await API.all("/servicos");
    const specialties = await API.all("/especialidades");
    const pacientes =
      user.role === "paciente" ? [] : await API.all("/pacientes");
    const activePatients = pacientes.filter((p) => p.ativo !== false);
    const patientLabel = (p) =>
      `${p.nome}${p.cns ? ` • CNS final ${p.cns.slice(-4)}` : ""}${p.cpf ? ` • CPF final ${p.cpf.slice(-4)}` : ""}`;
    UI.page(
      "Novo agendamento",
      `<div class="card"><div class="card-body"><p class="alert alert-info">Atendimento gratuito pelo SUS. Confira com a unidade os documentos, o preparo e a necessidade de encaminhamento.</p><form id="booking" class="row g-3"><div class="col-md-6"><label class="form-label" for="servico">Serviço</label><select class="form-select" id="servico" name="servico">${UI.option("", "Atendimento sem serviço específico")}${services.map((s) => UI.option(s._id, s.nome)).join("")}</select></div><div class="col-md-6"><label class="form-label" for="especialidade">Especialidade</label><select class="form-select" id="especialidade" name="especialidade">${UI.option("", "Selecione")}${specialties.map((s) => UI.option(s._id, s.nome)).join("")}</select></div><p id="orientacoes" class="pre-wrap"></p>${user.role !== "paciente" ? `<div class="col-md-6"><label class="form-label" for="busca-paciente">Buscar paciente por Cartão do SUS ou CPF</label><input class="form-control mb-2" id="busca-paciente" type="search" placeholder="Digite o Cartão do SUS ou CPF" inputmode="numeric" autocomplete="off"><label class="form-label" for="paciente">Paciente que fará a consulta</label><select class="form-select" id="paciente" name="paciente" required>${UI.option("", "Selecione")}${activePatients.map((p) => UI.option(p._id, patientLabel(p))).join("")}</select></div>` : ""}<div class="col-md-6"><label class="form-label" for="unidade">Unidade de saúde</label><select class="form-select" id="unidade" name="unidade" required>${UI.option("", "Selecione a unidade")}${units.map((u) => UI.option(u._id, `${u.nome} • ${UI.unitType(u.tipo)}`)).join("")}</select></div><div class="col-md-6"><label class="form-label" for="medico">Profissional</label><select class="form-select" name="medico" id="medico" required>${UI.option("", "Selecione")}${medicos
        .filter((m) => user.role !== "medico" || m._id === user.perfil.id)
        .map((m) => UI.option(m._id, `${m.nome} • ${m.crm}`))
        .join(
          "",
        )}</select></div>${UI.input("data", "Data", "date", "required")}<div class="col-md-6"><label class="form-label" for="hora">Horário disponível</label><select class="form-select" name="hora" id="hora" required disabled aria-describedby="availability-status">${UI.option("", "Selecione profissional e data")}</select><p id="availability-status" class="small mt-2 mb-0" role="status" aria-live="polite"></p>${API.admin ? `<a id="availability-manage" class="small d-none" href="/profissionais/profissionais.html">Liberar ou alterar horários em Profissionais</a>` : ""}</div><p id="doctor-schedule" class="small text-muted col-12"></p><div class="col-12"><label class="form-label" for="observacoes">Comentário para o médico (opcional)</label><textarea class="form-control" name="observacoes" id="observacoes" maxlength="2000" aria-describedby="doctor-comment-help"></textarea><p class="small text-muted mt-2" id="doctor-comment-help">Até 2000 caracteres. Após o envio, somente o médico responsável pela consulta poderá ler este comentário.</p></div><div class="col-12"><p class="text-muted small">Atendimentos de 30 minutos. Horário local de Araranguá (SC).</p><button type="submit" id="booking-submit" class="btn btn-primary" disabled>Confirmar agendamento</button></div></form></div></div>`,
    );
    const form = document.getElementById("booking");
    if (
      API.admin &&
      new URLSearchParams(location.search).get("paciente") === "me" &&
      user.pacienteId
    )
      form.elements.paciente.value = user.pacienteId;
    const search = document.getElementById("busca-paciente");
    search?.addEventListener("input", () => {
      const select = document.getElementById("paciente");
      const selected = select.value;
      const term = search.value.trim();
      const digits = term.replace(/\D/g, "");
      const matches = activePatients.filter(
        (p) =>
          !term ||
          (/^[\d\s.-]+$/.test(term) &&
            digits.length > 0 &&
            [p.cns, p.cpf].some((value) => value?.includes(digits))),
      );
      select.innerHTML =
        UI.option(
          "",
          matches.length ? "Selecione" : "Nenhum paciente encontrado",
        ) + matches.map((p) => UI.option(p._id, patientLabel(p))).join("");
      if (matches.some((p) => p._id === selected)) select.value = selected;
    });
    const unit = document.getElementById("unidade");
    const examMode = () =>
      services.find((s) => s._id === document.getElementById("servico").value)
        ?.tipo === "exame";
    const day = document.getElementById("data");
    const doctor = document.getElementById("medico");
    const time = document.getElementById("hora");
    const availabilityStatus = document.getElementById("availability-status");
    const manage = document.getElementById("availability-manage");
    const submit = document.getElementById("booking-submit");
    day.min = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    let request = 0;
    async function available() {
      const current = ++request;
      time.disabled = true;
      submit.disabled = true;
      availabilityStatus.textContent = "";
      manage?.classList.add("d-none");
      const schedule = examMode()
        ? null
        : medicos.find((m) => m._id === doctor.value)?.horarioDisponivel;
      document.getElementById("doctor-schedule").textContent = examMode()
        ? "Exame agendado pela unidade. O médico responsável será definido conforme a disponibilidade dos profissionais vinculados."
        : schedule?.diasSemana?.length
          ? `Expediente semanal: ${schedule.diasSemana.join(", ")}, das ${schedule.horaInicio} às ${schedule.horaFim}. A disponibilidade pode variar em datas específicas.`
          : "";
      time.innerHTML = UI.option("", "Carregando horários…");
      if (!day.value || (examMode() ? !unit.value : !doctor.value)) {
        time.innerHTML = UI.option(
          "",
          examMode()
            ? "Selecione unidade e data"
            : "Selecione profissional e data",
        );
        return;
      }
      try {
        const data = await API.request(
          `/agendamentos/disponibilidade?${examMode() ? `unidade=${encodeURIComponent(unit.value)}&servico=${encodeURIComponent(document.getElementById("servico").value)}` : `medico=${encodeURIComponent(doctor.value)}`}&data=${encodeURIComponent(day.value)}`,
        );
        if (current !== request) return;
        time.innerHTML =
          UI.option(
            "",
            data.horarios.length ? "Selecione" : "Nenhum horário disponível",
          ) + data.horarios.map((h) => UI.option(h, h)).join("");
        time.disabled = !data.horarios.length;
        submit.disabled = !data.horarios.length;
        availabilityStatus.textContent = data.horarios.length
          ? `${data.horarios.length} horário(s) livre(s) para esta data.`
          : data.mensagem ||
            "Não há horários livres nesta data. Confira o expediente acima ou escolha outra data.";
        if (!data.horarios.length) manage?.classList.remove("d-none");
      } catch (error) {
        if (current === request) {
          time.innerHTML = UI.option("", "Não foi possível consultar");
          availabilityStatus.textContent = error.message;
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
              (!unit.value || refId(m.unidade) === unit.value) &&
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
      specialty.disabled = examMode() || Boolean(selected?.especialidade);
      specialty.closest(".col-md-6").hidden = examMode();
      document.getElementById("orientacoes").textContent =
        selected?.orientacoes || "";
      const previous = unit.value;
      const offered = units.filter(
        (u) =>
          !selected ||
          selected.tipo !== "exame" ||
          u.servicos?.includes(selected._id),
      );
      unit.innerHTML =
        UI.option("", "Selecione a unidade") +
        offered
          .map((u) => UI.option(u._id, `${u.nome} • ${UI.unitType(u.tipo)}`))
          .join("");
      unit.value = offered.some((u) => u._id === previous)
        ? previous
        : offered.length === 1
          ? offered[0]._id
          : "";
      doctor.disabled = examMode();
      doctor.required = !examMode();
      doctor.closest(".col-md-6").hidden = examMode();
      filterDoctors();
    }
    unit.value =
      new URLSearchParams(location.search).get("unidade") ||
      (units.length === 1 ? units[0]._id : "");
    unit.addEventListener("change", filterDoctors);
    service.addEventListener("change", chooseService);
    specialty.addEventListener("change", filterDoctors);
    const requestedService = new URLSearchParams(location.search).get(
      "servico",
    );
    if (services.some((s) => s._id === requestedService))
      service.value = requestedService;
    chooseService();
    const requestedDoctor = new URLSearchParams(location.search).get("medico");
    const requestedDoctorUnit = refId(
      medicos.find((m) => m._id === requestedDoctor)?.unidade,
    );
    if (requestedDoctorUnit && !examMode()) {
      unit.value = requestedDoctorUnit;
      filterDoctors();
    }
    if (Array.from(doctor.options).some((o) => o.value === requestedDoctor))
      doctor.value = requestedDoctor;
    day.addEventListener("change", available);
    doctor.addEventListener("change", available);
    day.addEventListener("input", () => {
      ++request;
      time.disabled = true;
      submit.disabled = true;
      time.innerHTML = UI.option(
        "",
        "Confirme a data para consultar os horários",
      );
      availabilityStatus.textContent = "";
      manage?.classList.add("d-none");
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        if (!time.value || time.disabled)
          throw new Error("Selecione um horário disponível.");
        const data = Object.fromEntries(new FormData(form));
        if (specialty.value) data.especialidade = specialty.value;
        else delete data.especialidade;
        if (!data.servico) delete data.servico;
        if (!data.unidade) delete data.unidade;
        if (examMode()) delete data.medico;
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
