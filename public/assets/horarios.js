window.Horarios = {
  days: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  fallback: {
    diasSemana: ["segunda", "terça", "quarta", "quinta", "sexta"],
    horaInicio: "08:00",
    horaFim: "17:00",
  },
  fields(prefix, schedule) {
    const s = schedule || this.fallback;
    return `<fieldset class="col-12"><legend class="h6">Dias de atendimento</legend><div class="d-flex flex-wrap gap-3">${this.days.map((d, i) => `<div class="form-check"><input type="checkbox" class="form-check-input" name="dia" id="${prefix}-dia-${i}" value="${d}" ${s.diasSemana.includes(d) ? "checked" : ""}><label class="form-check-label" for="${prefix}-dia-${i}">${d}</label></div>`).join("")}</div></fieldset><div class="col-md-6"><label class="form-label" for="${prefix}-inicio">Início do expediente</label><input class="form-control" type="time" id="${prefix}-inicio" name="horaInicio" required value="${UI.escape(s.horaInicio)}"></div><div class="col-md-6"><label class="form-label" for="${prefix}-fim">Fim do expediente</label><input class="form-control" type="time" id="${prefix}-fim" name="horaFim" required value="${UI.escape(s.horaFim)}"></div><p class="small text-muted col-12">Horário de Brasília. Consultas de 30 minutos.</p>`;
  },
  read(form) {
    const data = new FormData(form);
    const schedule = {
      diasSemana: data.getAll("dia"),
      horaInicio: data.get("horaInicio"),
      horaFim: data.get("horaFim"),
    };
    if (!schedule.diasSemana.length)
      throw new Error("Selecione pelo menos um dia de atendimento.");
    if (schedule.horaFim <= schedule.horaInicio)
      throw new Error("O fim deve ser posterior ao início do expediente.");
    return schedule;
  },
};
