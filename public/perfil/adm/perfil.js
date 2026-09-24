document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require(["admin", "super_admin"]);
    if (!user) return;
    const users = await API.all("/auth/usuarios", "usuarios");
    UI.page(
      "Administração",
      `<div class="d-flex flex-wrap gap-2 mb-4"><a class="btn btn-primary" href="/cadastro/paciente/paciente.html">Cadastrar paciente</a><a class="btn btn-primary" href="/cadastro/medico/medico.html">Cadastrar médico</a><a class="btn btn-outline-primary" href="/perfil/editar/editar.html">Minha senha</a></div><div class="card mb-4"><div class="card-body"><h2 class="h5">Usuários</h2><div class="table-responsive"><table class="table"><thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${users.map((u) => `<tr><td>${UI.escape(u.nome)}</td><td>${UI.escape(u.email)}</td><td>${UI.escape(u.role)}</td><td>${UI.escape(u.status)}</td><td>${user.role === "super_admin" && u.id !== user.id ? `<button data-user="${u.id}" data-status="${u.status === "ativo" ? "inativo" : "ativo"}" class="btn btn-sm btn-outline-secondary">${u.status === "ativo" ? "Desativar" : "Ativar"}</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></div></div><div class="row g-3"><div class="col-lg-6"><div class="card"><div class="card-body"><h2 class="h5">Cadastrar especialidade</h2><form id="specialty" class="row g-3">${UI.input("nome", "Nome", "text", "required")}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div></div><div class="col-lg-6"><div class="card"><div class="card-body"><h2 class="h5">Cadastrar serviço</h2><form id="service" class="row g-3">${UI.input("nomeServico", "Nome", "text", "required")}${UI.input("valor", "Valor em reais", "number", 'required min="0" step="0.01"')}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div></div></div><button class="btn btn-outline-primary mt-4" id="audit">Consultar auditoria</button><div id="logs" class="mt-3"></div>`,
    );
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
            data.valor = Number(data.valor);
            data.duracao = 30;
          }
          await API.request(endpoint, {
            method: "POST",
            body: JSON.stringify(data),
          });
          form.reset();
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
