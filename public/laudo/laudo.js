document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    async function render() {
      const laudos = await API.all("/laudos");
      const consultas =
        user.role === "medico"
          ? (await API.all("/agendamentos")).filter(
              (a) => a.status === "realizado",
            )
          : [];
      UI.page(
        "Laudos",
        `${user.role === "medico" ? `<div class="card mb-4"><div class="card-body"><h2 class="h5">Emitir laudo</h2><form id="laudo" class="row g-3"><div class="col-12"><label class="form-label" for="agendamento">Consulta realizada</label><select class="form-select" id="agendamento" name="agendamento" required>${UI.option("", "Selecione")}${consultas.map((c) => UI.option(c._id, `${UI.date(c.data)} • ${c.paciente?.nome}`)).join("")}</select></div>${UI.input("titulo", "Título", "text", 'required maxlength="200"')}<div class="col-12"><label class="form-label" for="descricao">Descrição</label><textarea class="form-control" name="descricao" id="descricao" required maxlength="10000" rows="4"></textarea></div><div class="col-12"><label class="form-label" for="conclusao">Conclusão</label><textarea class="form-control" name="conclusao" id="conclusao" maxlength="10000"></textarea></div><div class="col-12"><button type="submit" class="btn btn-primary">Salvar rascunho</button></div></form></div></div>` : ""}<div class="row g-3">${laudos.length ? laudos.map((l) => `<article class="col-lg-6"><div class="card h-100"><div class="card-body"><span class="badge bg-secondary mb-2">${UI.escape(l.status)}</span><h2 class="h5">${UI.escape(l.titulo)}</h2><p>${UI.escape(l.paciente?.nome)} • ${UI.escape(l.medico?.nome)}</p><p class="pre-wrap">${UI.escape(l.descricao)}</p><p class="pre-wrap">${UI.escape(l.conclusao)}</p>${user.role === "medico" && l.status === "rascunho" ? `<div class="d-flex gap-2"><button class="btn btn-outline-primary" data-edit="${l._id}">Editar</button><button class="btn btn-primary" data-finalize="${l._id}">Finalizar e liberar</button></div>` : ""}</div></div></article>`).join("") : "<p>Nenhum laudo disponível.</p>"}</div>`,
      );
      let editing = null;
      const form = document.getElementById("laudo");
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        UI.submit(form, async () => {
          await API.request(editing ? `/laudos/${editing}` : "/laudos", {
            method: editing ? "PUT" : "POST",
            body: JSON.stringify(Object.fromEntries(new FormData(form))),
          });
          await render();
          UI.message(
            "Rascunho salvo. Confira o conteúdo antes de finalizar.",
            "success",
          );
        });
      });
      document.querySelectorAll("[data-edit]").forEach((button) =>
        button.addEventListener("click", () => {
          const record = laudos.find((l) => l._id === button.dataset.edit);
          editing = record._id;
          for (const name of [
            "agendamento",
            "titulo",
            "descricao",
            "conclusao",
          ])
            form.elements[name].value = record[name] || "";
          form.elements.agendamento.disabled = true;
          form.querySelector("[type=submit]").textContent = "Salvar alterações";
          form.scrollIntoView();
        }),
      );
      document.querySelectorAll("[data-finalize]").forEach((button) =>
        button.addEventListener("click", async () => {
          if (
            !confirm(
              "Liberar este laudo ao paciente? Após finalizar, o conteúdo não poderá ser alterado.",
            )
          )
            return;
          button.disabled = true;
          try {
            await API.request(`/laudos/${button.dataset.finalize}`, {
              method: "PUT",
              body: JSON.stringify({ status: "finalizado" }),
            });
            await render();
            UI.message("Laudo liberado ao paciente.", "success");
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
