document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    async function render() {
      const rows = await API.all("/agendamentos");
      UI.page(
        "Consultas",
        `<a class="btn btn-primary mb-3" href="/agendamento/agendamento.html">Novo agendamento</a><div class="row g-3">${rows.length ? rows.map((r) => `<div class="col-lg-6"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.date(r.data)} às ${UI.escape(r.hora)}</h2><p>Paciente: ${UI.escape(r.paciente?.nome)}<br>Profissional: ${UI.escape(r.medico?.nome)}</p><p class="badge bg-secondary">${UI.escape(r.status)}</p><div class="d-flex flex-wrap gap-2">${["agendado", "confirmado"].includes(r.status) ? `<button data-id="${r._id}" data-status="cancelado" class="btn btn-outline-danger">Cancelar</button>` : ""}${user.role !== "paciente" && r.status === "agendado" ? `<button data-id="${r._id}" data-status="confirmado" class="btn btn-outline-primary">Confirmar</button>` : ""}${user.role !== "paciente" && r.status === "confirmado" ? `<button data-id="${r._id}" data-status="realizado" class="btn btn-primary">Marcar como realizada</button><button data-id="${r._id}" data-status="falta" class="btn btn-outline-secondary">Registrar falta</button>` : ""}</div></div></div></div>`).join("") : "<p>Nenhuma consulta cadastrada.</p>"}</div>`,
      );
      document.querySelectorAll("[data-status]").forEach((button) =>
        button.addEventListener("click", async () => {
          if (
            button.dataset.status === "cancelado" &&
            !confirm("Cancelar este agendamento?")
          )
            return;
          button.disabled = true;
          try {
            await API.request(`/agendamentos/${button.dataset.id}`, {
              method: "PUT",
              body: JSON.stringify({ status: button.dataset.status }),
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
