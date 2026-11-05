document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const id = new URLSearchParams(location.search).get("id");
    if (!/^[a-f0-9]{24}$/i.test(id || ""))
      throw new Error("Selecione um laudo válido.");
    const labels = {
      nao_registrado: "Recebimento não registrado",
      recebido: "Recebido na unidade",
      disponivel: "Disponível para retirada",
      entregue: "Entregue",
    };
    const actions = {
      nao_registrado: ["recebido", "Registrar recebimento"],
      recebido: ["disponivel", "Disponibilizar para retirada"],
      disponivel: ["entregue", "Confirmar entrega"],
    };
    const date = (v) =>
      v
        ? new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
        : "—";
    async function render() {
      const report = await API.request(`/laudos/${id}`);
      const published = report.status !== "rascunho";
      const author =
        user.role === "medico" &&
        user.perfil?.id === (report.medico?._id || report.medico);
      const status = report.distribuicao?.situacao || "nao_registrado";
      const action = actions[status];
      const rows =
        API.admin && published
          ? await API.all(`/laudos/${id}/distribuicao`, "movimentos")
          : [];
      const fields = [
        ["Descrição", "descricao"],
        ["Resultados", "resultados"],
        ["Conclusão", "conclusao"],
        ["Recomendações", "recomendacoes"],
      ];
      UI.page(
        report.titulo,
        `
      <div class="screen-only d-flex flex-wrap gap-2 mb-3"><a class="btn btn-outline-secondary" href="/laudo/laudo.html">Voltar aos laudos</a><button type="button" class="btn btn-outline-primary" id="print-report">Imprimir laudo</button></div>
      ${report.substituidoPor ? `<div class="alert alert-warning">Este documento foi substituído por uma retificação. <a href="/laudo/detalhe.html?id=${UI.escape(report.substituidoPor)}">Consultar versão atual</a></div>` : ""}
      <article class="card"><div class="card-body"><p><strong>Paciente:</strong> ${UI.escape(report.paciente?.nome)}</p><p><strong>Médico:</strong> ${UI.escape(report.medico?.nome)} · CRM ${UI.escape(report.medico?.crm)}</p><p><strong>Versão:</strong> ${UI.escape(report.versao || 1)} · ${published ? `Publicado em ${UI.escape(date(report.publicadoEm || report.createdAt))}` : "Rascunho privado"}</p>
      ${report.retifica ? `<p><a href="/laudo/detalhe.html?id=${UI.escape(report.retifica)}">Consultar versão anterior</a></p><h2 class="h5">Motivo da retificação</h2><p class="report-content">${UI.escape(report.motivoRetificacao)}</p>` : ""}
      ${fields
        .filter(([, key]) => report[key])
        .map(
          ([label, key]) =>
            `<h2 class="h5">${label}</h2><p class="report-content">${UI.escape(report[key])}</p>`,
        )
        .join("")}</div></article>
      ${
        published
          ? `<section class="card mt-3 screen-only"><div class="card-body"><h2 class="h5">Retirada na unidade</h2><p>${UI.escape(labels[status])}</p><p class="small">Este acompanhamento é separado do acesso digital ao laudo.</p>
      ${
        API.admin
          ? `<h3 class="h6">Histórico de movimentações</h3>${
              rows.length
                ? `<ol>${[...rows]
                    .reverse()
                    .map(
                      (r) =>
                        `<li>${UI.escape(date(r.data))} · ${UI.escape(labels[r.situacao])} · registrado por ${UI.escape(r.responsavel?.nome || "Equipe da unidade")}${r.recebedor ? ` · recebido por ${UI.escape(r.recebedor)} (${UI.escape(r.vinculoRecebedor)})` : ""}</li>`,
                    )
                    .join("")}</ol>`
                : "<p>Nenhuma movimentação registrada.</p>"
            }`
          : ""
      }
      ${API.admin && action && !report.substituidoPor ? `<form id="distribution-form" class="row g-3">${action[0] === "entregue" ? `<div class="col-md-8"><label class="form-label" for="recipient">Nome de quem recebeu</label><input id="recipient" name="recebedor" class="form-control" required maxlength="120"></div><div class="col-md-4"><label class="form-label" for="recipient-role">Vínculo</label><select id="recipient-role" name="vinculoRecebedor" class="form-select" required><option value="">Selecione</option><option value="paciente">Paciente</option><option value="responsavel">Responsável autorizado</option></select></div><p class="small">Confira a identidade e a autorização para retirada antes de confirmar.</p>` : ""}<div class="col-12"><button type="submit" class="btn btn-primary">${action[1]}</button></div></form>` : ""}</div></section>`
          : ""
      }
      ${author && published && !report.substituidoPor ? `<section class="card mt-3 screen-only"><div class="card-body"><h2 class="h5">Retificar laudo</h2><p>A correção cria um novo rascunho. O documento original permanece disponível; a substituição ocorre ao publicar a nova versão.</p><form id="correction-form"><label class="form-label" for="correction-reason">Motivo da retificação</label><textarea id="correction-reason" name="motivo" class="form-control mb-3" required maxlength="2000"></textarea><button type="submit" class="btn btn-outline-primary">Criar rascunho de retificação</button></form></div></section>` : ""}`,
      );
      document.getElementById("print-report").onclick = () => window.print();
      const form = document.getElementById("distribution-form");
      if (form)
        form.onsubmit = (event) => {
          event.preventDefault();
          UI.submit(form, async () => {
            await API.request(`/laudos/${id}/distribuicao`, {
              method: "POST",
              body: JSON.stringify({
                ...Object.fromEntries(new FormData(form)),
                situacao: action[0],
              }),
            });
            await render();
            UI.message("Movimentação registrada.", "success");
          });
        };
      const correction = document.getElementById("correction-form");
      if (correction)
        correction.onsubmit = (event) => {
          event.preventDefault();
          UI.submit(correction, async () => {
            await API.request(`/laudos/${id}/retificacoes`, {
              method: "POST",
              body: JSON.stringify({
                motivo: correction.elements.motivo.value,
              }),
            });
            location.href = "/laudo/laudo.html";
          });
        };
    }
    await render();
  }),
);
