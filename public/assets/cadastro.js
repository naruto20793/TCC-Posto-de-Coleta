window.cadastro = async (role) => {
  const user = await API.require(["admin", "super_admin"]);
  if (!user) return;
  const specialties = role === "medico" ? await API.all("/especialidades") : [];
  UI.page(
    role === "medico" ? "Cadastrar profissional" : "Cadastrar paciente",
    `<div class="card"><div class="card-body"><form id="cadastro" class="row g-3">${UI.input("nome", "Nome completo", "text", 'required maxlength="120"')}${UI.input("email", "Email de acesso", "email", "required")}${UI.input("senha", "Senha inicial (mínimo 8 caracteres)", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}${UI.input("cpf", "CPF", "text", 'required inputmode="numeric" pattern="[0-9]{11}" maxlength="11" placeholder="11 dígitos, sem pontuação"')}${UI.input("telefone", "Telefone", "tel", "required")}${UI.input("dataNascimento", "Data de nascimento", "date", "required")}<div class="col-md-6"><label class="form-label" for="genero">Sexo / gênero cadastral</label><select class="form-select" id="genero" name="genero" required>${UI.option("", "Selecione")}${UI.option("M", "Masculino")}${UI.option("F", "Feminino")}${UI.option("Outro", "Outro")}</select></div>${role === "medico" ? `${UI.input("crm", "CRM / UF", "text", "required")}<div class="col-md-6"><label class="form-label" for="especialidade">Especialidade</label><select id="especialidade" name="especialidade" class="form-select" required>${UI.option("", "Selecione")}${specialties.map((e) => UI.option(e._id, e.nome)).join("")}</select></div><p class="small">Expediente inicial: segunda a sexta, das 08h às 17h.</p>` : ""}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar cadastro</button></div></form></div></div>`,
  );
  const form = document.getElementById("cadastro");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(form, async () => {
      const data = Object.fromEntries(new FormData(form));
      data.role = role;
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
        "Cadastro salvo. O usuário já pode entrar com o email e a senha informados.",
        "success",
      );
    });
  });
};
