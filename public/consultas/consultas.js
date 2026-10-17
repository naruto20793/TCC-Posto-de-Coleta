document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    function reviews(r) {
      if (r.status !== "realizado") return "";
      return [
        ["consulta", "Consulta", r.avaliacaoRegistrada, r.comentarioConsulta],
        ["medico", "Médico", r.avaliacaoMedicoRegistrada, r.comentarioMedico],
      ]
        .map(([tipo, label, sent, text]) => {
          const legacy = tipo === "consulta" && sent && text === undefined;
          const title = `<h3 class="h6 mt-4">Avaliação da ${tipo === "consulta" ? "consulta" : "atuação do médico"}</h3>`;
          if (user.role !== "paciente" || (sent && !legacy))
            return sent
              ? `${title}${tipo === "medico" ? `<p>Nota: ${UI.escape(r.notaMedico)}/5</p>` : ""}<p class="pre-wrap">${text ? UI.escape(text) : "Avaliação enviada sem comentário."}</p>`
              : "";
          const key = `${tipo}-${r._id}`;
          return `${title}<form class="rating-form" data-booking="${r._id}" data-type="${tipo}">
          ${legacy ? '<p>Sua nota anterior será mantida. Você pode acrescentar um comentário.</p><input type="hidden" name="nota" value="1">' : `<label class="form-label" for="rating-${key}">Sua nota para ${label.toLowerCase()}</label><select id="rating-${key}" name="nota" class="form-select mb-2" required><option value="">Selecione</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n} — ${["Muito insatisfeito", "Insatisfeito", "Neutro", "Satisfeito", "Muito satisfeito"][n - 1]}</option>`).join("")}</select>`}
          <label class="form-label" for="comment-${key}">Comentário${legacy ? "" : " (opcional)"}</label>
          <textarea id="comment-${key}" name="comentario" class="form-control mb-2" rows="3" maxlength="1000" ${legacy ? "required" : ""} placeholder="Conte como foi sua experiência"></textarea>
          <p class="small text-muted">Até 1000 caracteres. Palavras impróprias serão substituídas por asteriscos. Visível a você, ao médico do atendimento e à administração. Evite dados pessoais ou informações de saúde.</p>
          <button class="btn btn-outline-primary" type="submit">${legacy ? "Adicionar comentário" : "Enviar avaliação"}</button></form>`;
        })
        .join("");
    }
    async function render() {
      const rows = await API.all("/agendamentos");
      UI.page(
        "Consultas",
        `<a class="btn btn-primary mb-3" href="/agendamento/agendamento.html">Novo agendamento</a><div class="row g-3">${rows.length ? rows.map((r) => `<div class="col-lg-6"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.date(r.data)} às ${UI.escape(r.hora)}</h2><p>Paciente: ${UI.escape(r.paciente?.nome)}<br>Profissional: ${UI.escape(r.medico?.nome)}${r.servico ? `<br>Serviço: ${UI.escape(r.servico.nome)}` : ""}${r.especialidade ? `<br>Especialidade: ${UI.escape(r.especialidade.nome)}` : ""}</p>${r.examesRealizados !== undefined ? `<p>Exames realizados: ${UI.escape(r.examesRealizados)}</p>` : ""}<p class="badge bg-secondary">${UI.escape(r.status)}</p><div class="d-flex flex-wrap gap-2">${["agendado", "confirmado"].includes(r.status) ? `<button data-id="${r._id}" data-status="cancelado" class="btn btn-outline-danger">Cancelar</button>` : ""}${user.role !== "paciente" && r.status === "agendado" ? `<button data-id="${r._id}" data-status="confirmado" class="btn btn-outline-primary">Confirmar</button>` : ""}${user.role !== "paciente" && r.status === "confirmado" ? `<button data-id="${r._id}" data-status="realizado" class="btn btn-primary">Marcar como realizada</button><button data-id="${r._id}" data-status="falta" class="btn btn-outline-secondary">Registrar falta</button>` : ""}</div>${reviews(r)}</div></div></div>`).join("") : "<p>Nenhuma consulta cadastrada.</p>"}</div>`,
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
                  tipo: form.dataset.type,
                  comentario: form.elements.comentario.value,
                }),
              },
            );
            await render();
            UI.message("Obrigado pela sua avaliação!", "success");
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
