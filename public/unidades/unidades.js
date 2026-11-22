document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = API.user ? await API.require() : null;
    const units = await API.all("/unidades");
    const services = await API.all("/servicos");
    const doctors = user ? await API.all("/medicos") : [];
    const types = API.admin ? await API.request("/unidades/tipos") : null;
    const formFields = (unit = {}) =>
      `${UI.input("nome", "Nome da unidade", "text", `required maxlength="120" value="${UI.escape(unit.nome || "")}"`)}<div class="col-md-6"><label class="form-label" for="tipo-${unit._id || "new"}">Tipo de unidade</label><select class="form-select" id="tipo-${unit._id || "new"}" name="tipo" required>${types.tipos.map((t) => `<option value="${t}" ${unit.tipo === t ? "selected" : ""}>${UI.unitType(t)}</option>`).join("")}</select></div><div class="col-md-6"><label class="form-label" for="nivel-${unit._id || "new"}">Nível de atendimento</label><select class="form-select" id="nivel-${unit._id || "new"}" name="nivel" required>${types.niveis.map((n) => `<option value="${n}" ${unit.nivel === n ? "selected" : ""}>${UI.unitLevel(n)}</option>`).join("")}</select></div>${UI.input("telefone", "Telefone da unidade", "tel", `maxlength="30" value="${UI.escape(unit.telefone || "")}"`)}${UI.input("endereco", "Endereço da unidade", "text", `maxlength="500" value="${UI.escape(unit.endereco || "")}"`)}<div class="col-md-6"><label class="form-label">Serviços e exames oferecidos<select class="form-select" name="servicos" multiple size="5">${services.map((s) => `<option value="${s._id}" ${(unit.servicos || []).includes(s._id) ? "selected" : ""}>${UI.escape(s.nome)}${s.tipo === "exame" ? " (exame)" : ""}</option>`).join("")}</select></label><p class="small text-muted">Selecione os serviços disponíveis nesta unidade.</p></div><div class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" name="ativo" id="ativo-${unit._id || "new"}" ${unit.ativo !== false ? "checked" : ""}><label class="form-check-label" for="ativo-${unit._id || "new"}">Unidade ativa para novos agendamentos</label></div><div class="col-12"><button type="submit" class="btn btn-primary">${unit._id ? "Salvar unidade" : "Cadastrar unidade"}</button></div>`;
    const visible = API.admin ? units : units.filter((u) => u.ativo);
    UI.page(
      "Unidades de saúde",
      `<p>Escolha a unidade onde deseja realizar seu atendimento ou exame.</p>${API.admin ? `<div class="d-flex flex-wrap gap-2 mb-3"><a class="btn btn-outline-primary" href="/profissionais/profissionais.html">Gerenciar médicos e horários</a><a class="btn btn-outline-primary" href="/cadastro/medico/medico.html">Cadastrar médico</a><a class="btn btn-outline-primary" href="/relatorios/relatorios.html">Relatórios por unidade</a></div><details class="card mb-4"><summary class="card-body">Cadastrar nova unidade de saúde</summary><div class="card-body"><form class="unit-form row g-3">${formFields()}</form></div></details>${doctors.some((d) => !d.unidade) ? '<p class="alert alert-warning">Há médicos antigos sem unidade. Vincule-os em Gerenciar médicos e horários → Editar cadastro.</p>' : ""}` : ""}<div class="row g-3">${
        visible.length
          ? visible
              .map((u) => {
                const linked = doctors.filter(
                  (d) => (d.unidade?._id || d.unidade) === u._id,
                );
                return `<div class="col-lg-6"><section class="card h-100"><div class="card-body"><h2 class="h5">${UI.escape(u.nome)}</h2><p>${UI.escape(UI.unitType(u.tipo))} · ${UI.escape(UI.unitLevel(u.nivel))} · ${u.ativo ? "Ativa" : "Inativa"}</p><p>${UI.escape(u.endereco || "Endereço não informado")}</p>${u.telefone ? `<p>Telefone: ${UI.escape(u.telefone)}</p>` : ""}<h3 class="h6">Serviços e exames</h3><ul>${
                  services
                    .filter((s) => u.servicos.includes(s._id))
                    .map(
                      (s) =>
                        `<li>${UI.escape(s.nome)} ${u.ativo ? `<a href="/agendamento/agendamento.html?unidade=${u._id}&servico=${s._id}">Consultar horários</a>` : ""}</li>`,
                    )
                    .join("") || "<li>Nenhum serviço informado.</li>"
                }</ul><h3 class="h6">Médicos vinculados</h3>${user ? `<ul>${linked.map((d) => `<li>${UI.escape(d.nome)} · ${UI.escape(d.crm)}</li>`).join("") || "<li>Nenhum médico vinculado.</li>"}</ul><a class="btn btn-outline-primary" href="/profissionais/profissionais.html?unidade=${u._id}">Ver médicos e horários</a>` : '<a href="/login/login.html">Entre para consultar médicos e horários.</a>'}${API.admin ? `<details class="mt-3"><summary>Editar unidade</summary><form class="unit-form row g-3 mt-2" data-id="${u._id}">${formFields(u)}</form></details>` : ""}</div></section></div>`;
              })
              .join("")
          : "<p>Nenhuma unidade de saúde cadastrada.</p>"
      }</div>`,
    );
    // Forms repeat field names within their own scope; assign unique IDs for accessible labels.
    document.querySelectorAll(".unit-form").forEach((form, index) => {
      form.querySelectorAll("input[id]").forEach((input) => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        input.id += `-${index}`;
        if (label) label.htmlFor = input.id;
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        UI.submit(form, async () => {
          const values = new FormData(form);
          const body = Object.fromEntries(values);
          body.servicos = values.getAll("servicos");
          body.ativo = form.elements.ativo.checked;
          await API.request(
            `/unidades${form.dataset.id ? `/${form.dataset.id}` : ""}`,
            {
              method: form.dataset.id ? "PUT" : "POST",
              body: JSON.stringify(body),
            },
          );
          location.reload();
        });
      });
    });
  }),
);
