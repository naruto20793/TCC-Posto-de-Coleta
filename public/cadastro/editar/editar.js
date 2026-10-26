document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const user = await API.require();
    if (!user) return;
    const params = new URLSearchParams(location.search),
      type = params.get("tipo"),
      recordId = params.get("id");
    if (
      !["paciente", "medico"].includes(type) ||
      !/^[a-f0-9]{24}$/i.test(recordId || "")
    )
      throw new Error("Cadastro inválido.");
    const own =
      user.perfil?.id === recordId &&
      user.perfil?.model === (type === "medico" ? "Medico" : "Paciente");
    if (!API.admin && !own && !(user.role === "medico" && type === "paciente"))
      throw new Error("Você só pode editar seu próprio cadastro.");
    const path = type === "paciente" ? "pacientes" : "medicos";
    const record = await API.request(`/${path}/${recordId}`);
    const specialties =
      type === "medico" ? await API.all("/especialidades") : [];
    const selected = (record.especialidades || []).map((e) => e._id || e);
    const back = own
      ? `/perfil/${type === "medico" ? "médico" : "paciente"}/perfil.html`
      : type === "paciente"
        ? "/consultas/pacientes.html"
        : "/profissionais/profissionais.html";
    UI.page(
      `Editar cadastro de ${type === "medico" ? "médico" : "paciente"}`,
      `<a class="btn btn-outline-secondary mb-3" href="${back}">Voltar</a><section class="card"><div class="card-body"><h2 class="h5">${UI.escape(record.nome)}</h2><form id="edit-record" class="row g-3">${UI.input("nome", "Nome completo", "text", `required maxlength="120" value="${UI.escape(record.nome)}"`)}${UI.input("telefone", "Telefone", "tel", `required maxlength="30" value="${UI.escape(record.telefone)}"`)}${UI.input("cpf", "CPF", "text", `readonly value="${UI.escape(record.cpf)}"`)}${UI.input("email", "E-mail de acesso", "email", `readonly value="${UI.escape(record.email)}"`)}${UI.input("dataNascimento", "Data de nascimento", "date", `required value="${UI.escape(String(record.dataNascimento || "").slice(0, 10))}"`)}<div class="col-md-6"><label class="form-label" for="genero">Sexo / gênero cadastral</label><select id="genero" name="genero" class="form-select" required>${UI.option("", "Selecione")}${[
        ["M", "Masculino"],
        ["F", "Feminino"],
        ["Outro", "Outro"],
      ]
        .map(
          ([value, label]) =>
            `<option value="${value}" ${record.genero === value ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></div>${type === "medico" ? `${UI.input("crm", "CRM / UF", "text", `required value="${UI.escape(record.crm)}"`)}<div class="col-md-6"><label class="form-label" for="especialidades">Especialidades</label><select id="especialidades" name="especialidades" class="form-select" multiple required>${specialties.map((s) => `<option value="${UI.escape(s._id)}" ${selected.includes(s._id) ? "selected" : ""}>${UI.escape(s.nome)}</option>`).join("")}</select><p class="small text-muted">Você pode selecionar mais de uma especialidade.</p></div>` : ""}<fieldset class="col-12"><legend class="h6">Endereço</legend><div class="row g-3">${[
        ["rua", "Rua"],
        ["numero", "Número"],
        ["complemento", "Complemento"],
        ["bairro", "Bairro"],
        ["cidade", "Cidade"],
        ["estado", "Estado / UF"],
        ["cep", "CEP"],
      ]
        .map(([key, label]) =>
          UI.input(
            `endereco_${key}`,
            label,
            "text",
            `maxlength="150" value="${UI.escape(record.endereco?.[key] || "")}"`,
          ),
        )
        .join(
          "",
        )}</div></fieldset><div class="col-12"><button type="submit" class="btn btn-primary">Salvar alterações</button></div></form></div></section>`,
    );
    const form = document.getElementById("edit-record");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        const values = new FormData(form);
        const data = Object.fromEntries(
          ["nome", "telefone", "dataNascimento", "genero"].map((key) => [
            key,
            values.get(key),
          ]),
        );
        data.endereco = Object.fromEntries(
          [
            "rua",
            "numero",
            "complemento",
            "bairro",
            "cidade",
            "estado",
            "cep",
          ].map((key) => [key, values.get(`endereco_${key}`)]),
        );
        if (type === "medico") {
          data.crm = values.get("crm");
          data.especialidades = values.getAll("especialidades");
        }
        await API.request(`/${path}/${recordId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        if (own) await API.require();
        UI.message("Cadastro atualizado com sucesso.", "success");
      });
    });
  }),
);
