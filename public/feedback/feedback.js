document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const types = {
      outro: "Comentário geral",
      elogio: "Elogio",
      duvida: "Dúvida",
      reclamacao: "Reclamação",
      avaliacao: "Avaliação",
      problema: "Problema",
      sugestao: "Sugestão",
    };
    const statuses = {
      novo: "Recebido",
      em_analise: "Em análise",
      concluido: "Concluído",
    };
    UI.page(
      "Central de comentários",
      `<section class="alert alert-info"><h2 class="h6">Comentários após uma consulta</h2><p>As avaliações e os comentários sobre consultas e médicos continuam disponíveis na tela Consultas, após o atendimento ser marcado como realizado.</p><a class="btn btn-outline-primary" href="/consultas/consultas.html${API.admin && user.pacienteId ? "?meus=1" : ""}">Ir para Consultas</a></section><section class="card mb-4"><div class="card-body"><h2 class="h5">Enviar comentário</h2><p>Compartilhe um comentário geral, elogio, dúvida, reclamação, avaliação, problema ou sugestão. Seu envio será visível a você e à administração.</p><form id="system-feedback" class="row g-3"><div class="col-md-6"><label class="form-label" for="tipo">Tipo de comentário</label><select id="tipo" name="tipo" class="form-select">${Object.entries(
        types,
      )
        .map(([value, label]) => UI.option(value, label))
        .join(
          "",
        )}</select></div><div class="col-md-6"><label id="nota-label" class="form-label" for="nota">Nota</label><select id="nota" name="nota" class="form-select" required>${UI.option("", "Selecione")}${[1, 2, 3, 4, 5].map((n) => UI.option(n, `${n} — ${["Muito ruim", "Ruim", "Regular", "Bom", "Muito bom"][n - 1]}`)).join("")}</select></div><div class="col-12"><label class="form-label" for="comentario">Comentário</label><textarea id="comentario" name="comentario" class="form-control" rows="4" maxlength="1000" aria-describedby="feedback-help" placeholder="Conte o que funcionou, o que pode melhorar ou qual problema encontrou"></textarea><p class="small text-muted mt-2" id="feedback-help">Até 1000 caracteres. Palavras impróprias identificadas pelo filtro serão censuradas. Não inclua senhas, CPF ou informações de saúde.</p></div><div class="col-12"><button class="btn btn-primary" type="submit">Enviar comentário</button></div></form></div></section><section aria-labelledby="history-title"><h2 id="history-title" class="h4">${API.admin ? "Comentários recebidos" : "Meus comentários"}</h2><div class="row g-3 mb-3"><div class="col-md-6"><label class="form-label" for="filter-type">Filtrar por tipo</label><select id="filter-type" class="form-select">${UI.option("", "Todos os tipos")}${Object.entries(
        types,
      )
        .map(([value, label]) => UI.option(value, label))
        .join(
          "",
        )}</select></div><div class="col-md-6"><label class="form-label" for="filter-status">Filtrar por andamento</label><select id="filter-status" class="form-select">${UI.option("", "Todos os andamentos")}${Object.entries(
        statuses,
      )
        .map(([value, label]) => UI.option(value, label))
        .join(
          "",
        )}</select></div></div><p id="feedback-list-status" role="status" aria-live="polite"></p><button id="reload-feedback" type="button" class="btn btn-outline-primary mb-3">Atualizar comentários</button><div id="feedback-list" class="row g-3"></div></section>`,
    );
    const form = document.getElementById("system-feedback");
    const typeFilter = document.getElementById("filter-type"),
      statusFilter = document.getElementById("filter-status");
    const list = document.getElementById("feedback-list"),
      listStatus = document.getElementById("feedback-list-status");
    let rows = [];
    function syncRequirements() {
      const rating = form.elements.tipo.value === "avaliacao";
      form.elements.nota.required = rating;
      form.elements.comentario.required = !rating;
      document.getElementById("nota-label").textContent =
        `Nota${rating ? "" : " (opcional)"}`;
    }
    form.elements.tipo.addEventListener("change", syncRequirements);
    function render() {
      const filtered = rows.filter(
        (r) =>
          (!typeFilter.value || r.tipo === typeFilter.value) &&
          (!statusFilter.value || r.status === statusFilter.value),
      );
      listStatus.textContent = filtered.length
        ? `${filtered.length} comentário(s) encontrado(s).`
        : "Nenhum comentário encontrado.";
      list.innerHTML = filtered
        .map(
          (r) =>
            `<article class="col-lg-6"><div class="card feedback-card h-100"><div class="card-body"><h3 class="h5">${UI.escape(types[r.tipo] || r.tipo)}</h3><p><span class="badge bg-secondary">${UI.escape(statuses[r.status] || r.status)}</span>${r.nota !== undefined ? ` <span>Nota: ${UI.escape(r.nota)}/5</span>` : ""}</p>${API.admin ? `<p>Enviado por: ${UI.escape(r.usuario?.nome || "Usuário indisponível")}</p>` : ""}<p class="small text-muted">${UI.escape(new Date(r.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))}</p><p class="feedback-comment">${UI.escape(r.comentario || "Avaliação enviada sem comentário.")}</p>${
              API.admin
                ? `<form class="feedback-status row g-2" data-id="${UI.escape(r._id)}"><div class="col-12"><label class="form-label" for="status-${UI.escape(r._id)}">Andamento</label><select class="form-select" id="status-${UI.escape(r._id)}" name="status">${Object.entries(
                    statuses,
                  )
                    .map(
                      ([value, label]) =>
                        `<option value="${value}" ${r.status === value ? "selected" : ""}>${label}</option>`,
                    )
                    .join(
                      "",
                    )}</select></div><div class="col-12"><button class="btn btn-outline-primary" type="submit">Atualizar andamento</button></div></form>`
                : ""
            }</div></div></article>`,
        )
        .join("");
      list.querySelectorAll(".feedback-status").forEach((statusForm) =>
        statusForm.addEventListener("submit", (event) => {
          event.preventDefault();
          UI.submit(statusForm, async () => {
            await API.request(`/feedback-sistema/${statusForm.dataset.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                status: statusForm.elements.status.value,
              }),
            });
            await load();
            UI.message("Andamento atualizado.", "success");
          });
        }),
      );
    }
    async function load() {
      listStatus.textContent = "Carregando comentários…";
      try {
        rows = await API.all("/feedback-sistema");
        render();
      } catch (error) {
        listStatus.textContent =
          "Não foi possível carregar os comentários. Tente novamente.";
        throw error;
      }
    }
    document
      .getElementById("reload-feedback")
      .addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await load();
        } catch (error) {
          UI.message(error.message);
        } finally {
          button.disabled = false;
        }
      });
    typeFilter.addEventListener("change", render);
    statusFilter.addEventListener("change", render);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        const data = {
          tipo: form.elements.tipo.value,
          comentario: form.elements.comentario.value,
        };
        if (form.elements.nota.value)
          data.nota = Number(form.elements.nota.value);
        await API.request("/feedback-sistema", {
          method: "POST",
          body: JSON.stringify(data),
        });
        form.reset();
        syncRequirements();
        UI.message(
          "Comentário enviado. Obrigado por ajudar a melhorar o sistema!",
          "success",
        );
        try {
          await load();
        } catch {
          /* O envio já foi confirmado, sem solicitar reenvio. */
        }
      });
    });
    syncRequirements();
    try {
      await load();
    } catch (error) {
      UI.message(error.message);
    }
  }),
);
