document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const ownView = new URLSearchParams(location.search).get("meus") === "1";
    async function render() {
      const laudos = await API.all(ownView ? "/laudos?meus=1" : "/laudos");
      const consultas =
        user.role === "medico"
          ? (await API.all("/agendamentos")).filter(
              (a) => a.status === "realizado",
            )
          : [];
      const drafts = laudos.filter((l) => l.status === "rascunho");
      const published = laudos.filter((l) =>
        ["finalizado", "assinado"].includes(l.status),
      );
      function cards(rows, empty) {
        return `<div class="row g-3">${rows.length ? rows.map((l) => `<article class="col-lg-6"><div class="card h-100"><div class="card-body"><span class="badge ${l.status === "rascunho" ? "bg-secondary" : "bg-success"} mb-2">${l.status === "rascunho" ? "Rascunho privado" : l.status === "assinado" ? "Publicado e assinado" : "Publicado"}</span><h3 class="h5">${UI.escape(l.titulo)}</h3><p>${UI.escape(l.paciente?.nome)} • ${UI.escape(l.medico?.nome)}</p>${l.publicadoEm ? `<p class="small text-muted">Publicado em ${UI.escape(new Date(l.publicadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))}</p>` : ""}<p class="pre-wrap">${UI.escape(l.descricao)}</p><p class="pre-wrap">${UI.escape(l.conclusao)}</p>${user.role === "medico" && l.status === "rascunho" ? `<p class="small text-muted">Somente você pode visualizar este rascunho.</p><div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" data-edit="${l._id}">Editar</button><button class="btn btn-primary" data-finalize="${l._id}">Publicar laudo</button></div>` : ""}</div></div></article>`).join("") : `<p>${empty}</p>`}</div>`;
      }
      UI.page(
        ownView ? "Meus laudos" : "Laudos",
        `${user.role === "medico" ? `<section class="card mb-4"><div class="card-body"><h2 class="h5">Emitir laudo</h2><p>Salve um rascunho privado ou publique para o paciente titular, os médicos e a administração. Após publicar, o conteúdo não poderá ser alterado.</p><form id="laudo" class="row g-3"><div class="col-12"><label class="form-label" for="agendamento">Consulta realizada</label><select class="form-select" id="agendamento" name="agendamento" required>${UI.option("", "Selecione")}${consultas.map((c) => UI.option(c._id, `${UI.date(c.data)} • ${c.paciente?.nome}`)).join("")}</select></div>${UI.input("titulo", "Título", "text", 'required maxlength="200"')}<div class="col-12"><label class="form-label" for="descricao">Descrição</label><textarea class="form-control" name="descricao" id="descricao" required maxlength="10000" rows="4"></textarea></div><div class="col-12"><label class="form-label" for="conclusao">Conclusão</label><textarea class="form-control" name="conclusao" id="conclusao" maxlength="10000"></textarea></div><div class="col-12 d-flex flex-wrap gap-2"><button type="submit" name="acao" value="rascunho" class="btn btn-outline-primary">Salvar rascunho</button><button type="submit" name="acao" value="finalizado" class="btn btn-primary">Publicar laudo</button><button type="button" id="cancel-edit" class="btn btn-outline-secondary d-none">Cancelar edição</button></div></form></div></section><section class="mb-4" aria-labelledby="drafts-title"><h2 id="drafts-title" class="h4">Meus rascunhos</h2>${cards(drafts, "Você não tem rascunhos salvos.")}</section>` : ""}<section aria-labelledby="published-title"><h2 id="published-title" class="h4">Laudos publicados</h2>${cards(published, "Nenhum laudo publicado disponível.")}</section>`,
      );
      let editing = null;
      const form = document.getElementById("laudo");
      function confirmPublish() {
        return confirm(
          "Publicar este laudo para o paciente titular, os médicos e a administração? Após publicar, o conteúdo não poderá ser alterado.",
        );
      }
      async function submitAction(action) {
        const buttons = form.querySelectorAll("button");
        buttons.forEach((b) => (b.disabled = true));
        try {
          await action();
        } finally {
          buttons.forEach((b) => (b.disabled = false));
        }
      }
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const status =
          event.submitter?.value === "finalizado" ? "finalizado" : "rascunho";
        if (status === "finalizado" && !confirmPublish()) return;
        UI.submit(form, () =>
          submitAction(async () => {
            const data = Object.fromEntries(new FormData(form));
            delete data.acao;
            data.status = status;
            await API.request(editing ? `/laudos/${editing}` : "/laudos", {
              method: editing ? "PUT" : "POST",
              body: JSON.stringify(data),
            });
            await render();
            UI.message(
              status === "finalizado"
                ? "Laudo publicado para o paciente titular e a equipe."
                : "Rascunho salvo. Somente você pode visualizá-lo.",
              "success",
            );
          }),
        );
      });
      document.getElementById("cancel-edit")?.addEventListener("click", () => {
        editing = null;
        form.reset();
        form.elements.agendamento.disabled = false;
        form.querySelector('[value="rascunho"]').textContent =
          "Salvar rascunho";
        document.getElementById("cancel-edit").classList.add("d-none");
      });
      document.querySelectorAll("[data-edit]").forEach((button) =>
        button.addEventListener("click", () => {
          const record = laudos.find((l) => l._id === button.dataset.edit);
          editing = record._id;
          for (const name of ["titulo", "descricao", "conclusao"])
            form.elements[name].value = record[name] || "";
          form.elements.agendamento.value =
            record.agendamento?._id || record.agendamento || "";
          form.elements.agendamento.disabled = true;
          form.querySelector('[value="rascunho"]').textContent =
            "Salvar alterações no rascunho";
          document.getElementById("cancel-edit").classList.remove("d-none");
          form.scrollIntoView();
        }),
      );
      document.querySelectorAll("[data-finalize]").forEach((button) =>
        button.addEventListener("click", async () => {
          if (editing === button.dataset.finalize) {
            form.requestSubmit(form.querySelector('[value="finalizado"]'));
            return;
          }
          if (!confirmPublish()) return;
          button.disabled = true;
          try {
            await API.request(`/laudos/${button.dataset.finalize}`, {
              method: "PUT",
              body: JSON.stringify({ status: "finalizado" }),
            });
            await render();
            UI.message(
              "Laudo publicado para o paciente titular e a equipe.",
              "success",
            );
          } catch (error) {
            button.disabled = false;
            UI.message(error.message);
          }
        }),
      );
    }
    await render();
  }),
);
