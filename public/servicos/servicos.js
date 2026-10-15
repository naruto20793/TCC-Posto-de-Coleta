document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const services = await API.all("/servicos");
    UI.page(
      "Serviços disponíveis",
      `<p class="alert alert-info">Atendimento pelo SUS, gratuito para o paciente. Confira as orientações da unidade antes do atendimento.</p><div class="row g-3">${services.length ? services.map((s) => `<div class="col-md-6 col-lg-4"><div class="card h-100"><div class="card-body"><h2 class="h5">${UI.escape(s.nome)}</h2><p class="pre-wrap">${UI.escape(s.descricao)}</p>${s.orientacoes ? `<p class="pre-wrap"><strong>Orientações:</strong> ${UI.escape(s.orientacoes)}</p>` : "<p>Consulte a equipe sobre preparo e documentos necessários.</p>"}<a class="btn btn-outline-primary" href="/agendamento/agendamento.html?servico=${encodeURIComponent(s._id)}">Consultar horários</a></div></div></div>`).join("") : "<p>Nenhum serviço cadastrado.</p>"}</div>`,
    );
  }),
);
