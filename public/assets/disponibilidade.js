window.Disponibilidade = {
  form(id) {
    return `<details class="mt-3"><summary>Gerenciar horários livres por data</summary><form class="daily-availability row g-3 mt-1" data-id="${UI.escape(id)}"><p class="col-12">Escolha uma data para liberar horários extras ou bloquear horários livres. Consultas já marcadas serão mantidas.</p><div class="col-12"><label class="form-label" for="dia-${id}">Data de atendimento</label><input class="form-control" type="date" required id="dia-${id}" name="data"></div><p class="daily-status col-12" role="status" aria-live="polite">Escolha a data para carregar os horários.</p><fieldset class="daily-controls col-12" disabled><legend class="h6">Horários liberados para consultas</legend><div class="daily-times d-flex flex-wrap gap-3 mb-3"></div><div class="row g-2"><div class="col-sm-6"><label class="form-label" for="inicio-${id}">Liberar a partir de</label><input class="form-control" type="time" id="inicio-${id}" name="inicio" value="08:00"></div><div class="col-sm-6"><label class="form-label" for="fim-${id}">Até</label><input class="form-control" type="time" id="fim-${id}" name="fim" value="17:00"></div><div class="col-12 d-flex flex-wrap gap-2"><button class="btn btn-outline-primary daily-add" type="button">Adicionar faixa de horários</button><button class="btn btn-outline-danger daily-clear" type="button">Bloquear horários livres</button></div></div><p class="small text-muted mt-3">Desmarque para bloquear. Cada consulta dura 30 minutos, no horário de Brasília. Horários ocupados não podem ser desmarcados.</p><div class="d-flex flex-wrap gap-2"><button type="submit" class="btn btn-primary">Salvar disponibilidade da data</button><button type="button" class="btn btn-outline-secondary daily-reset">Usar expediente semanal</button></div></fieldset></form></details>`;
  },
  init() {
    document.querySelectorAll(".daily-availability").forEach((form) => {
      const day = form.elements.data;
      const status = form.querySelector(".daily-status");
      const controls = form.querySelector(".daily-controls");
      const list = form.querySelector(".daily-times");
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
      }).format(new Date());
      day.min = today;
      day.max = new Date(Date.now() + 89 * 86400000).toISOString().slice(0, 10);
      let version = 0,
        loadedDay = null,
        reserved = [],
        times = [];
      function selected() {
        return Array.from(
          list.querySelectorAll("input:checked"),
          (input) => input.value,
        );
      }
      function render() {
        const all = [...new Set([...times, ...reserved])].sort();
        list.innerHTML = all.length
          ? all
              .map(
                (time, i) =>
                  `<div class="form-check"><input class="form-check-input" type="checkbox" id="slot-${form.dataset.id}-${i}" value="${UI.escape(time)}" ${times.includes(time) || reserved.includes(time) ? "checked" : ""} ${reserved.includes(time) ? "disabled" : ""}><label class="form-check-label" for="slot-${form.dataset.id}-${i}">${UI.escape(time)}${reserved.includes(time) ? " (ocupado)" : ""}</label></div>`,
              )
              .join("")
          : '<p class="mb-0">Nenhum horário liberado. Adicione uma faixa para abrir a agenda.</p>';
      }
      async function load() {
        const current = ++version,
          value = day.value;
        loadedDay = null;
        controls.disabled = true;
        list.innerHTML = "";
        if (!value) {
          status.textContent = "Escolha a data para carregar os horários.";
          return;
        }
        status.textContent = "Carregando horários…";
        try {
          const data = await API.request(
            `/medicos/${form.dataset.id}/disponibilidade?data=${encodeURIComponent(value)}`,
          );
          if (current !== version) return;
          times = data.horarios;
          reserved = data.reservados;
          loadedDay = value;
          status.textContent = data.personalizado
            ? "Disponibilidade personalizada nesta data."
            : "Esta data segue o expediente semanal.";
          controls.disabled = false;
          render();
        } catch (error) {
          if (current === version) status.textContent = error.message;
        }
      }
      day.addEventListener("change", load);
      day.addEventListener("input", () => {
        ++version;
        loadedDay = null;
        controls.disabled = true;
      });
      form.querySelector(".daily-add").addEventListener("click", () => {
        const toMinutes = (time) =>
          /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
            ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
            : NaN;
        const start = toMinutes(form.elements.inicio.value),
          end = toMinutes(form.elements.fim.value);
        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          end - start < 30
        ) {
          status.textContent = "Informe uma faixa com pelo menos 30 minutos.";
          return;
        }
        times = selected();
        for (let n = start; n + 30 <= end; n += 30) {
          if (!times.some((time) => Math.abs(toMinutes(time) - n) < 30))
            times.push(
              `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`,
            );
        }
        render();
        status.textContent =
          "Confira os horários e clique em Salvar disponibilidade da data.";
      });
      form.querySelector(".daily-clear").addEventListener("click", () => {
        times = [...reserved];
        render();
        status.textContent =
          "Horários livres removidos. Salve para confirmar o bloqueio.";
      });
      async function save(useDefault) {
        if (!loadedDay || loadedDay !== day.value)
          throw new Error("Carregue os horários desta data antes de salvar.");
        const data = loadedDay;
        await API.request(`/medicos/${form.dataset.id}/disponibilidade`, {
          method: "PUT",
          body: JSON.stringify({
            data,
            ...(useDefault ? { usarPadrao: true } : { horarios: selected() }),
          }),
        });
        if (day.value === data) await load();
        UI.message(
          "Disponibilidade salva. O agendamento já utiliza os horários liberados para essa data.",
          "success",
        );
      }
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        UI.submit(form, () => save(false));
      });
      form
        .querySelector(".daily-reset")
        .addEventListener("click", () => UI.submit(form, () => save(true)));
    });
  },
};
