document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    let user = API.user;
    if (user) {
      const data = await API.request("/auth/me");
      user = data.usuario;
    }
    UI.page(
      user ? `Olá, ${user.nome}` : "Posto de Coleta Araranguá",
      `<div class="card mb-4"><div class="card-body"><h2 class="h4">Seu atendimento em um só lugar</h2><p>Consulte serviços, acompanhe seus agendamentos e acesse os laudos liberados pela equipe.</p><a class="btn btn-primary" href="${user ? "/agendamento/agendamento.html" : "/login/login.html"}">${user ? "Agendar atendimento" : "Entrar na minha conta"}</a></div></div><div class="row g-3">${[
        [
          "Consultas",
          "/consultas/consultas.html",
          "Acompanhe os horários e a situação dos atendimentos.",
        ],
        [
          "Laudos",
          "/laudo/laudo.html",
          "Consulte resultados liberados pelo profissional.",
        ],
        [
          "Serviços",
          "/servicos/servicos.html",
          "Conheça os serviços disponíveis na unidade.",
        ],
      ]
        .map(
          ([title, url, text]) =>
            `<div class="col-md-4"><div class="card h-100"><div class="card-body"><h2 class="h5">${title}</h2><p>${text}</p><a class="btn btn-outline-primary" href="${url}">Acessar</a></div></div></div>`,
        )
        .join("")}</div>`,
    );
  }),
);
