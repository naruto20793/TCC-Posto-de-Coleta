document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    async function render() {
      const rows = await API.all("/agendamentos");
      UI.page(
        "Consultas",
        `<a class="btn btn-primary mb-3" href="/agendamento/agendamento.html">Novo agendamento</a><div class="row g-3">${rows.length ? rows.map((r) => `<div class="col-lg-6"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.date(r.data)} às ${UI.escape(r.hora)}</h2><p>Paciente: ${UI.escape(r.paciente?.nome)}<br>Profissional: ${UI.escape(r.medico?.nome)}${r.servico ? `<br>Serviço: ${UI.escape(r.servico.nome)}` : ""}${r.especialidade ? `<br>Especialidade: ${UI.escape(r.especialidade.nome)}` : ""}</p>${r.examesRealizados !== undefined ? `<p>Exames realizados: ${UI.escape(r.examesRealizados)}</p>` : ""}<p class="badge bg-secondary">${UI.escape(r.status)}</p><div class="d-flex flex-wrap gap-2">${["agendado", "confirmado"].includes(r.status) ? `<button data-id="${r._id}" data-status="cancelado" class="btn btn-outline-danger">Cancelar</button>` : ""}${user.role !== "paciente" && r.status === "agendado" ? `<button data-id="${r._id}" data-status="confirmado" class="btn btn-outline-primary">Confirmar</button>` : ""}${user.role !== "paciente" && r.status === "confirmado" ? `<button data-id="${r._id}" data-status="realizado" class="btn btn-primary">Marcar como realizada</button><button data-id="${r._id}" data-status="falta" class="btn btn-outline-secondary">Registrar falta</button>` : ""}</div>${user.role === "paciente" && r.status === "realizado" && !r.avaliacaoRegistrada ? `<form class="mt-3 rating-form" data-booking="${r._id}"><label class="form-label" for="rating-${r._id}">Como foi seu atendimento?</label><div class="d-flex gap-2"><select id="rating-${r._id}" name="nota" class="form-select" required><option value="">Selecione uma nota</option><option value="1">1 — Muito insatisfeito</option><option value="2">2 — Insatisfeito</option><option value="3">3 — Neutro</option><option value="4">4 — Satisfeito</option><option value="5">5 — Muito satisfeito</option></select><button class="btn btn-outline-primary" type="submit">Avaliar</button></div><small>Uma avaliação por atendimento. Apenas os totais são públicos.</small></form>` : ""}</div></div></div>`).join("") : "<p>Nenhuma consulta cadastrada.</p>"}</div>`,
      );
      document.querySelectorAll(".rating-form").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          UI.submit(form, async () => {
            await API.request(
              `/agendamentos/${form.dataset.booking}/avaliacao`,
              {
                method: "POST",
                body: JSON.stringify({
                  nota: Number(form.elements.nota.value),
                }),
              },
            );
            form.innerHTML =
              '<p class="text-success">Obrigado pela sua avaliação!</p>';
          });
        });
      });
      document.querySelectorAll("[data-status]").forEach((button) =>
        button.addEventListener("click", async () => {
          if (
            button.dataset.status === "cancelado" &&
            !confirm("Cancelar este agendamento?")
          )
            return;
          const body = { status: button.dataset.status };
          if (body.status === "realizado") {
            const value = prompt(
              "Quantos exames foram realizados? Informe 0 se foi apenas consulta.",
            );
            if (value === null) return;
            if (!/^\d+$/.test(value.trim()) || Number(value) > 1000) {
              UI.message("Informe um número inteiro de 0 a 1000.");
              return;
            }
            body.examesRealizados = Number(value);
          }
          button.disabled = true;
          try {
            await API.request(`/agendamentos/${button.dataset.id}`, {
              method: "PUT",
              body: JSON.stringify(body),
            });
            await render();
            UI.message("Consulta atualizada.", "success");
          } catch (error) {
            UI.message(error.message);
            button.disabled = false;
          }
        }),
      );
    }
    await render();
  }),
);
