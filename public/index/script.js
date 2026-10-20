document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    let user = API.user;
    if (user) {
      const data = await API.request("/auth/me");
      user = data.usuario;
      if (user.trocarSenha) {
        location.replace("/login/trocar-senha.html");
        return;
      }
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
            <p class="mt-3 mb-4">Seus atendimentos pelo SUS, agendamentos e resultados reunidos aqui. O atendimento é gratuito para o paciente.</p>
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
        .join("")}</div></section>
      <section class="public-statistics" aria-labelledby="statistics-title"><h2 id="statistics-title" class="h4">Nossa unidade em números</h2><p class="section-intro">Totais registrados no sistema, desde o início dos registros. Informações públicas, sem dados pessoais.</p><div id="statistics-content" aria-live="polite" aria-busy="true"><p>Carregando estatísticas…</p></div></section>`,
    );
    const statistics = document.getElementById("statistics-content");
    async function loadStatistics() {
      statistics.setAttribute("aria-busy", "true");
      statistics.textContent = "Carregando estatísticas…";
      try {
        const data = await API.request("/estatisticas");
        const counts = [
          "exames",
          "atendimentos",
          "avaliacoes",
          "registrosExames",
        ];
        if (
          counts.some((k) => !Number.isSafeInteger(data[k]) || data[k] < 0) ||
          !Array.isArray(data.mensal) ||
          data.mensal.length !== 6 ||
          data.mensal.some(
            (r) =>
              !/^\d{4}-\d{2}$/.test(r.mes) ||
              !Number.isSafeInteger(r.exames) ||
              r.exames < 0,
          ) ||
          (data.satisfacao !== null &&
            (!Number.isFinite(data.satisfacao) ||
              data.satisfacao < 0 ||
              data.satisfacao > 100))
        )
          throw new Error("Estatísticas inválidas");
        const cards = [
          [
            data.registrosExames ? data.exames.toLocaleString("pt-BR") : "—",
            "Exames realizados",
            data.registrosExames
              ? "Quantidade informada pela equipe nos atendimentos concluídos."
              : "Ainda sem quantidades de exames registradas.",
          ],
          [
            data.satisfacao === null ? "—" : `${data.satisfacao}%`,
            "Satisfação dos pacientes",
            data.avaliacoes
              ? `${data.avaliacoes.toLocaleString("pt-BR")} avaliações. Percentual de notas 4 ou 5, em uma escala de 1 a 5.`
              : "Ainda sem avaliações. Pacientes podem avaliar em Consultas após o atendimento.",
          ],
          [
            data.atendimentos.toLocaleString("pt-BR"),
            "Atendimentos concluídos",
            "Total de atendimentos marcados como realizados.",
          ],
        ];
        const max = Math.max(1, ...data.mensal.map((r) => r.exames));
        statistics.innerHTML = `<div class="row g-3">${cards
          .map(
            ([value, label, detail]) =>
              `<div class="col-md-4"><div class="card stat-card"><strong class="stat-number">${value}</strong><h3 class="h6 mt-3">${label}</h3><p class="small">${detail}</p></div></div>`,
          )
          .join("")}</div>
          <figure class="card p-4 mt-4"><figcaption class="h5">Exames realizados nos últimos 6 meses</figcaption>
          <p class="small text-muted">Por mês do atendimento. Registros antigos sem quantidade informada não entram na contagem.</p>
          ${!data.mensal.some((r) => r.exames) ? "<p>Nenhum exame registrado neste período.</p>" : ""}
          <div class="exam-chart" role="list" aria-label="Quantidade de exames por mês">${data.mensal
            .map((r) => {
              const label = new Intl.DateTimeFormat("pt-BR", {
                month: "short",
                year: "2-digit",
                timeZone: "UTC",
              }).format(new Date(`${r.mes}-01T12:00:00Z`));
              return `<div class="exam-chart-row" role="listitem" aria-label="${label}: ${r.exames} exames"><span>${label}</span><div class="exam-chart-track" aria-hidden="true"><div class="exam-chart-bar" style="width:${(100 * r.exames) / max}%"></div></div><strong>${r.exames.toLocaleString("pt-BR")}</strong></div>`;
            })
            .join("")}</div></figure>`;
      } catch {
        statistics.innerHTML =
          '<p>As estatísticas estão indisponíveis no momento.</p><button type="button" class="btn btn-outline-primary" id="retry-statistics">Tentar novamente</button>';
        document
          .getElementById("retry-statistics")
          .addEventListener("click", loadStatistics);
      } finally {
        statistics.setAttribute("aria-busy", "false");
      }
    }
    await loadStatistics();
  }),
);
