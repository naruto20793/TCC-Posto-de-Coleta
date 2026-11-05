document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require(["admin", "super_admin"]);
    if (!user) return;
    const users = await API.all("/auth/usuarios", "usuarios");
    const specialties = await API.all("/especialidades");
    UI.page(
      "Administração",
      `<div class="d-flex flex-wrap gap-2 mb-4"><a class="btn btn-primary" href="/cadastro/paciente/paciente.html">Cadastrar paciente</a><a class="btn btn-primary" href="/cadastro/medico/medico.html">Cadastrar médico</a><a class="btn btn-outline-primary" href="/perfil/adm/perfil.html">Meu perfil</a></div><div class="card mb-4"><div class="card-body"><h2 class="h5">Usuários</h2><div class="table-responsive"><table class="table"><thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${users.map((u) => `<tr><td>${UI.escape(u.nome)}</td><td>${UI.escape(u.email)}</td><td>${UI.escape(u.role)}</td><td>${UI.escape(u.status)}</td><td>${user.role === "super_admin" && u.id !== user.id ? `<button data-user="${u.id}" data-status="${u.status === "ativo" ? "inativo" : "ativo"}" class="btn btn-sm btn-outline-secondary">${u.status === "ativo" ? "Desativar" : "Ativar"}</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></div></div><div class="row g-3"><div class="col-lg-6"><div class="card"><div class="card-body"><h2 class="h5">Cadastrar especialidade</h2><form id="specialty" class="row g-3">${UI.input("nome", "Nome", "text", "required")}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div></div><div class="col-lg-6"><div class="card"><div class="card-body"><h2 class="h5">Cadastrar serviço</h2><form id="service" class="row g-3">${UI.input("nomeServico", "Nome", "text", "required")}<div class="col-12"><p class="small text-muted">Serviços gratuitos pelo SUS.</p><label class="form-label" for="service-specialty">Especialidade</label><select class="form-select" id="service-specialty" name="especialidade"><option value="">Sem especialidade específica</option>${specialties.map((e) => UI.option(e._id, e.nome)).join("")}</select></div><div class="col-12"><label class="form-label" for="service-description">Descrição</label><textarea id="service-description" name="descricao" class="form-control" maxlength="2000"></textarea></div><div class="col-12"><label class="form-label" for="service-guidance">Orientações</label><textarea id="service-guidance" name="orientacoes" class="form-control" maxlength="2000"></textarea></div><div class="col-12"><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div></div></div><button class="btn btn-outline-primary mt-4" id="audit">Consultar auditoria</button><div id="logs" class="mt-3"></div>`,
    );
    // A credencial de recuperação nunca é guardada no navegador ou na auditoria.
    const accountRows = document.querySelectorAll("tbody tr");
    users.forEach((account, index) => {
      if (
        account.id === user.id ||
        account.role === "super_admin" ||
        (user.role !== "super_admin" &&
          !["paciente", "medico"].includes(account.role))
      )
        return;
      const cell = accountRows[index]?.lastElementChild;
      if (!cell) return;
      const button = document.createElement("button");
      button.className = "btn btn-sm btn-outline-primary ms-2";
      button.textContent = "Redefinir senha";
      button.addEventListener("click", () => {
        let area = document.getElementById("password-reset-area");
        if (!area) {
          area = document.createElement("section");
          area.id = "password-reset-area";
          area.className = "card my-3";
          document.getElementById("feedback").after(area);
        }
        area.innerHTML = `<div class="card-body"><h2 class="h5">Redefinir acesso de ${UI.escape(account.nome)}</h2><p>Verifique a identidade da pessoa antes de continuar. A senha temporária expira em 24 horas e exige troca no próximo acesso.</p><form id="password-reset-form"><label for="operator-password" class="form-label">Confirme sua senha de administrador</label><input id="operator-password" type="password" class="form-control mb-3" required autocomplete="current-password" maxlength="72"><button type="submit" class="btn btn-primary">Gerar senha temporária</button> <button type="button" id="close-password-reset" class="btn btn-outline-secondary">Fechar</button></form><div id="temporary-password-result" role="status" class="mt-3"></div></div>`;
        const form = document.getElementById("password-reset-form");
        document.getElementById("close-password-reset").onclick = () =>
          area.remove();
        form.onsubmit = (event) => {
          event.preventDefault();
          UI.submit(form, async () => {
            const input = document.getElementById("operator-password");
            const password = input.value;
            input.value = "";
            const data = await API.request(
              `/auth/usuarios/${account.id}/senha-temporaria`,
              {
                method: "POST",
                body: JSON.stringify({ confirmacaoSenha: password }),
              },
            );
            const result = document.getElementById("temporary-password-result");
            result.textContent = `Senha temporária: ${data.senhaTemporaria}. Expira em ${new Date(data.expiraEm).toLocaleString("pt-BR")}. Feche esta área após entregar a senha.`;
            form.querySelector('[type="submit"]').hidden = true;
          });
        };
        area.scrollIntoView({ block: "center" });
        document.getElementById("operator-password").focus();
      });
      cell.append(button);
    });
    document.querySelectorAll("[data-user]").forEach((button) =>
      button.addEventListener("click", async () => {
        if (!confirm("Alterar o acesso deste usuário?")) return;
        button.disabled = true;
        try {
          await API.request(`/auth/usuarios/${button.dataset.user}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: button.dataset.status }),
          });
          location.reload();
        } catch (error) {
          button.disabled = false;
          UI.message(error.message);
        }
      }),
    );
    for (const [formId, endpoint] of [
      ["specialty", "/especialidades"],
      ["service", "/servicos"],
    ]) {
      const form = document.getElementById(formId);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        UI.submit(form, async () => {
          const data = Object.fromEntries(new FormData(form));
          if (formId === "service") {
            data.nome = data.nomeServico;
            delete data.nomeServico;
            if (!data.especialidade) delete data.especialidade;
            data.duracao = 30;
          }
          await API.request(endpoint, {
            method: "POST",
            body: JSON.stringify(data),
          });
          form.reset();
          if (formId === "specialty") {
            const updated = await API.all("/especialidades");
            document.getElementById("service-specialty").innerHTML =
              UI.option("", "Sem especialidade específica") +
              updated.map((e) => UI.option(e._id, e.nome)).join("");
          }
          UI.message("Registro salvo.", "success");
        });
      });
    }
    document.getElementById("audit").addEventListener("click", async () => {
      try {
        const data = await API.request("/auditoria");
        document.getElementById("logs").innerHTML =
          `<ul class="list-group">${data.logs.map((l) => `<li class="list-group-item">${UI.escape(new Date(l.data).toLocaleString("pt-BR"))} • ${UI.escape(l.nomeUsuario)} • ${UI.escape(l.acao)} • ${UI.escape(l.recurso)}</li>`).join("")}</ul>`;
      } catch (error) {
        UI.message(error.message);
      }
    });
  }),
);
