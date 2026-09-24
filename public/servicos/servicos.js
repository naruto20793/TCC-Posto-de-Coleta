document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const services = await API.all("/servicos");
    UI.page(
      "Serviços disponíveis",
      `<div class="row g-3">${services.length ? services.map((s) => `<div class="col-md-6 col-lg-4"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.escape(s.nome)}</h2><p class="pre-wrap">${UI.escape(s.descricao)}</p><p>${Number(s.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><a class="btn btn-outline-primary" href="/agendamento/agendamento.html">Consultar horários</a></div></div></div>`).join("") : "<p>Nenhum serviço cadastrado.</p>"}</div>`,
    );
  }),
);
