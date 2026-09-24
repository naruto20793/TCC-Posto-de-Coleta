document.addEventListener("DOMContentLoaded", () => {
  UI.page(
    "Acesse sua conta",
    `<div class="card mx-auto" style="max-width:520px"><div class="card-body"><p>Use seu email e senha para entrar.</p><form id="login" class="row g-3">${UI.input("email", "Email", "email", 'required autocomplete="username"')}${UI.input("senha", "Senha", "password", 'required autocomplete="current-password"')}<div class="col-12"><button type="submit" class="btn btn-primary w-100">Entrar</button></div></form><p class="small mt-3 mb-0">Esqueceu sua senha? Entre em contato com a administração da unidade.</p><p id="registerLink" class="mt-3 mb-0" hidden><a href="/cadastro/conta/conta.html">Criar conta para teste</a></p></div></div>`,
  );
  API.request("/auth/registration")
    .then((settings) => {
      document.getElementById("registerLink").hidden =
        !settings.publicRegistration;
    })
    .catch(() => {});
  const form = document.getElementById("login");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(form, async () => {
      const data = await API.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      API.save(data);
      location.href = "/index/index.html";
    });
  });
});
