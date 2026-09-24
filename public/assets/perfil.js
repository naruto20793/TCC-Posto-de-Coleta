window.showProfile = async () => {
  const user = await API.require();
  if (!user) return;
  const path =
    user.role === "paciente"
      ? "pacientes"
      : user.role === "medico"
        ? "medicos"
        : null;
  const record =
    path && user.perfil?.id
      ? await API.request(`/${path}/${user.perfil.id}`)
      : user;
  UI.page(
    "Meu perfil",
    `<div class="card mb-4"><div class="card-body"><p>${UI.escape(user.email)} • ${UI.escape(user.role)}</p>${path ? `<form id="profile" class="row g-3">${UI.input("nome", "Nome completo", "text", `required value="${UI.escape(record.nome)}"`)}${UI.input("telefone", "Telefone", "tel", `required value="${UI.escape(record.telefone)}"`)}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar perfil</button></div></form>` : `<p>${UI.escape(user.nome)}</p>`}</div></div><div class="card"><div class="card-body"><h2 class="h5">Alterar senha</h2><form id="password" class="row g-3">${UI.input("atual", "Senha atual", "password", 'required autocomplete="current-password"')}${UI.input("nova", "Nova senha", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}<div class="col-12"><button type="submit" class="btn btn-outline-primary">Atualizar senha</button></div></form></div></div>`,
  );
  const form = document.getElementById("profile");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(form, async () => {
      await API.request(`/${path}/${user.perfil.id}`, {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      await API.require();
      UI.message("Perfil atualizado.", "success");
    });
  });
  const password = document.getElementById("password");
  password.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(password, async () => {
      await API.request("/auth/senha", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(password))),
      });
      password.reset();
      alert("Senha atualizada. Entre novamente.");
      API.logout();
    });
  });
};
