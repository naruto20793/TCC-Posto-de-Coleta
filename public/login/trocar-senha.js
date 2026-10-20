document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require(null, true);
    if (!user) return;
    UI.page(
      "Escolha sua nova senha",
      `<div class="card mx-auto" style="max-width:600px"><div class="card-body"><p>Troque a senha inicial para continuar usando sua conta.</p><form id="change-initial-password" class="row g-3">${UI.input("atual", "Senha atual (CPF no primeiro acesso)", "password", 'required autocomplete="current-password" maxlength="72"')}${UI.input("nova", "Nova senha", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}${UI.input("confirmacao", "Confirme a nova senha", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}<p class="small">Use pelo menos 8 caracteres e uma senha diferente do CPF.</p><div class="col-12"><button class="btn btn-primary" type="submit">Salvar nova senha</button></div></form></div></div>`,
    );
    const form = document.getElementById("change-initial-password");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        if (form.elements.nova.value !== form.elements.confirmacao.value)
          throw new Error("As senhas não coincidem.");
        await API.request("/auth/senha", {
          method: "PATCH",
          body: JSON.stringify({
            atual: form.elements.atual.value,
            nova: form.elements.nova.value,
          }),
        });
        alert("Senha atualizada. Entre novamente com a nova senha.");
        API.logout();
      });
    });
  }),
);
