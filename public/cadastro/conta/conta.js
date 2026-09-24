document.addEventListener("DOMContentLoaded", () =>
  UI.start(async () => {
    const settings = await API.request("/auth/registration");
    if (!settings.publicRegistration) {
      UI.page(
        "Cadastro indisponível",
        '<p>O cadastro público de teste está desativado.</p><a class="btn btn-primary" href="/login/login.html">Voltar ao login</a>',
      );
      return;
    }

    const specialties = await API.all("/especialidades");
    UI.page(
      "Criar conta para teste",
      `
    <p class="alert alert-warning">Acesso temporário para testes. Super administrador pode gerenciar todo o sistema.</p>
    <div class="card"><div class="card-body">
      <form id="testRegistration" class="row g-3">
        <div class="col-md-6"><label class="form-label" for="role">Nível de acesso</label>
          <select class="form-select" id="role" name="role" required>
            ${UI.option("paciente", "Paciente")}${UI.option("medico", "Médico")}${UI.option("admin", "Administrador")}${UI.option("super_admin", "Super administrador")}
          </select>
        </div>
        ${UI.input("nome", "Nome completo", "text", 'required maxlength="120"')}
        ${UI.input("email", "Email de acesso", "email", 'required autocomplete="email"')}
        ${UI.input("senha", "Senha (mínimo 8 caracteres)", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}
        <div id="clinicalFields" class="row g-3 m-0 p-0">
          ${UI.input("cpf", "CPF", "text", 'inputmode="numeric" pattern="[0-9]{11}" maxlength="11" placeholder="11 dígitos"')}
          ${UI.input("telefone", "Telefone", "tel")}
          ${UI.input("dataNascimento", "Data de nascimento", "date")}
          <div class="col-md-6"><label class="form-label" for="genero">Sexo / gênero cadastral</label>
            <select class="form-select" id="genero" name="genero">
              ${UI.option("", "Selecione")}${UI.option("M", "Masculino")}${UI.option("F", "Feminino")}${UI.option("Outro", "Outro")}
            </select>
          </div>
        </div>
        <div id="doctorFields" class="row g-3 m-0 p-0 d-none">
          ${UI.input("crm", "CRM / UF", "text")}
          <div class="col-md-6"><label class="form-label" for="especialidade">Especialidade (opcional neste teste)</label>
            <select class="form-select" id="especialidade" name="especialidade">
              ${UI.option("", "Selecione depois")}${specialties.map((s) => UI.option(s._id, s.nome)).join("")}
            </select>
          </div>
        </div>
        <div class="col-12"><button class="btn btn-primary" type="submit">Criar conta</button></div>
      </form>
    </div></div>
    <p class="mt-3"><a href="/login/login.html">Já tenho conta</a></p>
  `,
    );

    const form = document.getElementById("testRegistration");
    function updateFields() {
      const role = form.elements.role.value;
      const clinical = ["paciente", "medico"].includes(role);
      const doctor = role === "medico";
      document
        .getElementById("clinicalFields")
        .classList.toggle("d-none", !clinical);
      document
        .getElementById("doctorFields")
        .classList.toggle("d-none", !doctor);
      for (const field of ["cpf", "telefone", "dataNascimento", "genero"]) {
        form.elements[field].disabled = !clinical;
        form.elements[field].required = clinical;
      }
      for (const field of ["crm", "especialidade"])
        form.elements[field].disabled = !doctor;
      form.elements.crm.required = doctor;
    }
    form.elements.role.addEventListener("change", updateFields);
    updateFields();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      UI.submit(form, async () => {
        const data = Object.fromEntries(new FormData(form));
        if (data.role === "medico") {
          data.especialidades = data.especialidade ? [data.especialidade] : [];
          delete data.especialidade;
        }
        await API.request("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        form.reset();
        updateFields();
        UI.message(
          "Conta criada. Entre com o email e a senha cadastrados.",
          "success",
        );
      });
    });
  }),
);
