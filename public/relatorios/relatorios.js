document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require(["admin", "super_admin"]);
    if (!user) return;
    const options = await API.request("/relatorios/opcoes");
    const select = (key, label, values) =>
      `<div class="col-md-6 col-lg-3"><label class="form-label" for="${key}">${label}</label><select class="form-select" id="${key}" name="${key}">${UI.option("", "Todos")}${values.map((v) => UI.option(v._id, v.nome)).join("")}</select></div>`;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    const start = new Date(`${today}T12:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 29);
    UI.page(
      "Relatórios",
      `
      <a href="/administracao/administracao.html" class="btn btn-outline-secondary mb-3">Voltar à administração</a>
      <p>Visão geral do atendimento e da gestão da unidade. Acesso exclusivo de administradores.</p>
      <section class="card mb-4"><div class="card-body"><h2 class="h5">Filtros do relatório</h2>
      <form id="report-filters" class="row g-3">
      ${UI.input("inicio", "Data inicial", "date", `value="${start.toISOString().slice(0, 10)}"`)}
      ${UI.input("fim", "Data final", "date", `value="${today}"`)}
      ${select("unidade", "Unidade de saúde", options.unidades || [])}${select("medico", "Médico", options.medicos)}${select("especialidade", "Especialidade", options.especialidades)}${select("servico", "Serviço", options.servicos)}
      <div class="col-md-6 col-lg-3"><label for="status" class="form-label">Situação da consulta</label><select id="status" name="status" class="form-select">${UI.option("", "Todas")}${options.status.map((s) => UI.option(s, s)).join("")}</select></div>
      <fieldset class="col-12"><legend class="h6">Seções incluídas</legend><div class="d-flex flex-wrap gap-3">${Object.entries(
        options.secoes,
      )
        .map(
          ([key, label]) =>
            `<div class="form-check"><input class="form-check-input" type="checkbox" name="secoes" id="secao-${UI.escape(key)}" value="${UI.escape(key)}" checked><label class="form-check-label" for="secao-${UI.escape(key)}">${UI.escape(label)}</label></div>`,
        )
        .join("")}</div></fieldset>
      <p class="small text-muted col-12 mb-0">Deixe as datas vazias para considerar todo o histórico. O alcance dos filtros aparece em cada seção. Os totais consideram todos os registros; tabelas limitadas indicam o limite.</p>
      <div class="col-12 d-flex flex-wrap gap-2"><button type="submit" class="btn btn-primary">Gerar relatório</button><button type="button" id="clear-filters" class="btn btn-outline-secondary">Limpar filtros</button><button type="button" id="download-pdf" class="btn btn-outline-primary" disabled>Salvar como PDF</button></div>
      </form></div></section><p id="report-status" role="status" aria-live="polite">Escolha os filtros e gere o relatório.</p><div id="report-result"></div>`,
    );
    const form = document.getElementById("report-filters");
    const download = document.getElementById("download-pdf");
    const status = document.getElementById("report-status");
    const result = document.getElementById("report-result");
    let appliedQuery = null;
    let generation = 0;
    function invalidate() {
      ++generation;
      appliedQuery = null;
      download.disabled = true;
      result.innerHTML = "";
      status.textContent =
        "Filtros alterados. Gere o relatório para atualizar os resultados.";
    }
    form.addEventListener("input", invalidate);
    form.addEventListener("change", invalidate);
    document.getElementById("clear-filters").addEventListener("click", () => {
      form.reset();
      form.elements.inicio.value = "";
      form.elements.fim.value = "";
      invalidate();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const current = ++generation;
      download.disabled = true;
      appliedQuery = null;
      result.innerHTML = "";
      UI.submit(form, async () => {
        const values = new FormData(form);
        const selected = values.getAll("secoes");
        if (!selected.length) throw new Error("Selecione ao menos uma seção.");
        if (
          values.get("inicio") &&
          values.get("fim") &&
          values.get("inicio") > values.get("fim")
        )
          throw new Error(
            "A data inicial deve ser anterior ou igual à data final.",
          );
        const params = new URLSearchParams();
        for (const key of [
          "inicio",
          "fim",
          "medico",
          "unidade",
          "especialidade",
          "servico",
          "status",
        ])
          if (values.get(key)) params.set(key, values.get(key));
        params.set("secoes", selected.join(","));
        status.textContent = "Gerando relatório…";
        try {
          const data = await API.request(`/relatorios?${params}`);
          if (current !== generation) return;
          result.innerHTML =
            `<div class="card mb-4"><div class="card-body"><h2 class="h5">Filtros aplicados</h2>${data.filtrosDescricao.map((f) => `<p class="mb-1">${UI.escape(f)}</p>`).join("")}<p class="small text-muted mb-0">Gerado em ${UI.escape(new Date(data.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))} (Araranguá)</p></div></div>` +
            data.secoes.map(renderSection).join("");
          appliedQuery = params.toString();
          download.disabled = false;
          status.textContent =
            "Relatório gerado. O PDF usará estes mesmos filtros e seções, com os dados atualizados no momento do download.";
        } catch (error) {
          if (current === generation)
            status.textContent =
              "Não foi possível gerar o relatório. Tente novamente.";
          throw error;
        }
      });
    });
    download.addEventListener("click", async () => {
      if (!appliedQuery) return;
      const query = appliedQuery;
      download.disabled = true;
      try {
        const blob = await API.request(`/relatorios/pdf?${query}`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio-geral-${today}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        UI.message("PDF gerado. Confira o download no navegador.", "success");
      } catch (error) {
        UI.message(error.message);
      } finally {
        download.disabled = !appliedQuery;
      }
    });
    function renderSection(section) {
      return `<section class="card mb-4 report-section"><div class="card-body"><h2 class="h4">${UI.escape(section.titulo)}</h2><p class="small text-muted">${UI.escape(section.descricao)}</p><div class="row g-3 mb-3">${section.metrics.map((m) => `<div class="col-sm-6 col-xl-3"><div class="report-metric"><span>${UI.escape(m.label)}</span><strong>${UI.escape(m.value)}</strong></div></div>`).join("")}</div>${section.tables.map((t) => `<h3 class="h6 mt-4">${UI.escape(t.title)}</h3>${t.rows.length ? `<div class="table-responsive"><table class="table table-striped align-middle"><caption class="visually-hidden">${UI.escape(t.title)}</caption><thead><tr>${t.columns.map((c) => `<th scope="col">${UI.escape(c)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((v) => `<td>${UI.escape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : '<p class="text-muted">Nenhum registro para os filtros selecionados.</p>'}`).join("")}</div></section>`;
    }
  }),
);
