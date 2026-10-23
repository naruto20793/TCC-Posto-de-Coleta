window.cadastro = async (role) => {
  const user = await API.require(["admin", "super_admin"]);
  if (!user) return;
  const specialties = role === "medico" ? await API.all("/especialidades") : [];
  const patientCPF =
    role === "paciente"
      ? `<div class="col-12"><label for="cpf" class="form-label">CPF</label><div class="d-flex gap-2"><input id="cpf" name="cpf" class="form-control" required inputmode="numeric" pattern="[0-9]{11}" maxlength="14" placeholder="11 dígitos, sem pontuação"><button id="lookup-cpf" class="btn btn-outline-primary text-nowrap" type="button">Buscar CPF</button></div><p class="small text-muted mt-2">Busca somente nos pacientes já cadastrados neste sistema. Confira os dados antes de salvar.</p><p id="cpf-result" role="status" aria-live="polite"></p></div>`
      : "";
  UI.page(
    role === "medico" ? "Cadastrar profissional" : "Cadastrar paciente",
    `<div class="card"><div class="card-body"><form id="cadastro" class="row g-3">${patientCPF}${UI.input("nome", "Nome completo", "text", 'required maxlength="120"')}${UI.input("email", "Email de acesso", "email", "required")}<p class="col-12 small text-muted">A senha inicial será o CPF, somente números. O usuário deverá trocá-la no primeiro acesso.</p>${role === "medico" ? UI.input("cpf", "CPF", "text", 'required inputmode="numeric" pattern="[0-9]{11}" maxlength="11" placeholder="11 dígitos, sem pontuação"') : ""}${UI.input("telefone", "Telefone", "tel", "required")}${UI.input("dataNascimento", "Data de nascimento", "date", "required")}<div class="col-md-6"><label class="form-label" for="genero">Sexo / gênero cadastral</label><select class="form-select" id="genero" name="genero" required>${UI.option("", "Selecione")}${UI.option("M", "Masculino")}${UI.option("F", "Feminino")}${UI.option("Outro", "Outro")}</select></div>${role === "medico" ? `${UI.input("crm", "CRM / UF", "text", "required")}<div class="col-md-6"><label class="form-label" for="especialidade">Especialidade</label><select id="especialidade" name="especialidade" class="form-select" required>${UI.option("", "Selecione")}${specialties.map((e) => UI.option(e._id, e.nome)).join("")}</select></div><p class="small">Expediente inicial: segunda a sexta, das 08h às 17h.</p>` : ""}${
      role === "paciente"
        ? `<fieldset class="col-12"><legend class="h6">Endereço (opcional)</legend><div class="row g-3">${[
            ["rua", "Rua"],
            ["numero", "Número"],
            ["complemento", "Complemento"],
            ["bairro", "Bairro"],
            ["cidade", "Cidade"],
            ["estado", "Estado / UF"],
            ["cep", "CEP"],
          ]
            .map(([key, label]) =>
              UI.input(`endereco_${key}`, label, "text", 'maxlength="150"'),
            )
            .join("")}</div></fieldset>`
        : ""
    }<div class="col-12"><button type="submit" class="btn btn-primary">Salvar cadastro</button></div></form></div></div>`,
  );
  const form = document.getElementById("cadastro");
  let existing = null;
  const save = form.querySelector("[type=submit]");
  let lookupVersion = 0;
  let searching = false;
  function unlock() {
    for (const name of ["email", "dataNascimento", "genero"])
      form.elements[name].disabled = false;
    save.textContent = "Salvar cadastro";
  }
  if (role === "paciente") {
    const cpf = form.elements.cpf;
    const lookup = document.getElementById("lookup-cpf");
    const status = document.getElementById("cpf-result");
    cpf.addEventListener("input", () => {
      cpf.value = cpf.value.replace(/\D/g, "").slice(0, 11);
      ++lookupVersion;
      searching = false;
      save.disabled = false;
      lookup.disabled = false;
      status.textContent = "";
      if (existing) {
        const value = cpf.value;
        form.reset();
        cpf.value = value;
        existing = null;
        unlock();
      }
    });
    async function lookupCPF() {
      const value = cpf.value.replace(/\D/g, "");
      if (!/^\d{11}$/.test(value)) {
        status.textContent = "Informe os 11 dígitos do CPF.";
        return;
      }
      cpf.value = value;
      const version = ++lookupVersion;
      searching = true;
      save.disabled = true;
      lookup.disabled = true;
      status.textContent = "Buscando cadastro…";
      try {
        const result = await API.request("/pacientes/consultar-cpf", {
          method: "POST",
          body: JSON.stringify({ cpf: value }),
        });
        if (version !== lookupVersion) return;
        if (!result.encontrado) {
          status.textContent =
            "CPF não encontrado na base deste sistema. Preencha os dados manualmente.";
          return;
        }
        const p = result.paciente;
        existing = p._id;
        for (const key of ["nome", "email", "telefone", "genero"])
          form.elements[key].value = p[key] || "";
        form.elements.dataNascimento.value = String(
          p.dataNascimento || "",
        ).slice(0, 10);
        for (const key of [
          "rua",
          "numero",
          "complemento",
          "bairro",
          "cidade",
          "estado",
          "cep",
        ])
          form.elements[`endereco_${key}`].value = p.endereco?.[key] || "";

        for (const key of ["email", "dataNascimento", "genero"])
          form.elements[key].disabled = true;
        save.textContent = "Atualizar cadastro existente";
        status.textContent =
          "Paciente já cadastrado. Nome, telefone e endereço podem ser atualizados. O acesso e os demais dados serão preservados." +
          (p.ativo === false
            ? " Cadastro inativo; procure a gestão de usuários para reativar."
            : "");
      } catch (error) {
        if (version === lookupVersion)
          status.textContent = `Não foi possível buscar o CPF: ${error.message}`;
      } finally {
        if (version === lookupVersion) {
          searching = false;
          save.disabled = false;
          lookup.disabled = false;
        }
      }
    }
    lookup.addEventListener("click", lookupCPF);
    cpf.addEventListener("blur", () => {
      if (/^\d{11}$/.test(cpf.value) && !existing && !searching) lookupCPF();
    });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (searching) return;
    UI.submit(form, async () => {
      const data = Object.fromEntries(new FormData(form));
      data.role = role;
      if (role === "paciente") {
        const address = {};
        for (const key of [
          "rua",
          "numero",
          "complemento",
          "bairro",
          "cidade",
          "estado",
          "cep",
        ]) {
          const value = data[`endereco_${key}`];
          delete data[`endereco_${key}`];
          if (value) address[key] = value;
        }
        data.endereco = address;
      }
      if (existing) {
        await API.request(`/pacientes/${existing}`, {
          method: "PUT",
          body: JSON.stringify({
            nome: data.nome,
            telefone: data.telefone,
            endereco: data.endereco,
          }),
        });
        UI.message(
          "Cadastro existente atualizado. Nenhuma conta duplicada foi criada.",
          "success",
        );
        return;
      }
      if (role === "medico") {
        data.especialidades = [data.especialidade];
        delete data.especialidade;
      }
      await API.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      form.reset();
      UI.message(
        "Cadastro salvo. O usuário deve entrar com o e-mail ou CPF e usar o CPF como senha inicial, e trocar a senha no primeiro acesso.",
        "success",
      );
    });
  });
};
