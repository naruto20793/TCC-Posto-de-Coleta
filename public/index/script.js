document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    let user = API.user;
    if (user) {
      const data = await API.request("/auth/me");
      user = data.usuario;
    }
    const icons = {
      Consultas:
        '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h3"/>',
      Laudos:
        '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8m-8 4h5"/>',
      Serviços: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    };
    UI.page(
      user ? `Olá, ${user.nome}` : "Bem-vindo ao Posto de Coleta",
      `<section class="welcome-panel" aria-labelledby="welcome-title">
        <div class="row g-4 align-items-center">
          <div class="col-lg-8">
            <p class="eyebrow">Posto de Coleta · Araranguá</p>
            <h2 id="welcome-title">Cuidar da sua saúde pode ser mais simples.</h2>
            <p class="mt-3 mb-4">Seus atendimentos, agendamentos e resultados reunidos aqui, para você acompanhar tudo com tranquilidade.</p>
            <a class="btn btn-primary" href="${user ? "/agendamento/agendamento.html" : "/login/login.html"}">${user ? "Agendar atendimento" : "Entrar na minha conta"}</a>
          </div>
          <div class="col-lg-4"><aside class="care-note"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg></span><h3 class="h5">Um passo de cada vez</h3><p>Antes do atendimento, confira as orientações de preparo com a equipe da unidade. Estamos aqui para ajudar.</p></aside></div>
        </div>
      </section>
      <section aria-labelledby="access-title"><h2 id="access-title" class="h4">Como podemos ajudar?</h2><p class="section-intro">Escolha o que você precisa acessar.</p><div class="row g-3">${[
        [
          "Consultas",
          "/consultas/consultas.html",
          "Confira os horários e acompanhe a situação dos seus atendimentos.",
          "Ver consultas",
        ],
        [
          "Laudos",
          "/laudo/laudo.html",
          "Acesse os resultados que já foram liberados pela equipe.",
          "Consultar laudos",
        ],
        [
          "Serviços",
          "/servicos/servicos.html",
          "Conheça os serviços disponíveis no Posto de Coleta.",
          "Conhecer serviços",
        ],
      ]
        .map(
          ([title, url, text, action]) =>
            `<div class="col-md-4"><div class="card service-card"><div class="card-body"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[title]}</svg></span><h3 class="h5">${title}</h3><p>${text}</p><a href="${url}">${action} <span aria-hidden="true">→</span></a></div></div></div>`,
        )
        .join("")}</div></section>`,
    );
  }),
);
