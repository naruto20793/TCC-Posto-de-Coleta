window.showProfile = async () => {
  const user = await API.require();
  if (!user) return;
  const admin = API.admin;
  const patient = admin
    ? (await API.request("/auth/me/paciente")).paciente
    : null;
  const patientForm = admin
    ? `<section class="card mb-4"><div class="card-body"><h2 class="h5">Meu cadastro como paciente</h2><p>${patient ? "Seu cadastro está vinculado à sua conta. Você aparece na lista de pacientes e pode receber consultas." : "Complete os dados para também utilizar o atendimento como paciente. Sua conta e senha continuam as mesmas."}</p>${patient ? '<div class="d-flex flex-wrap gap-2 mb-3"><a class="btn btn-primary" href="/agendamento/agendamento.html?paciente=me">Agendar para mim</a><a class="btn btn-outline-primary" href="/consultas/consultas.html?meus=1">Minhas consultas</a><a class="btn btn-outline-primary" href="/laudo/laudo.html?meus=1">Meus laudos</a></div>' : ""}<form id="own-patient" class="row g-3">${UI.input("cpf", "CPF", "text", `required inputmode="numeric" maxlength="14" value="${UI.escape(patient?.cpf || "")}" ${patient ? "readonly" : ""}`)}${UI.input("telefonePaciente", "Telefone para atendimento", "tel", `required maxlength="30" value="${UI.escape(patient?.telefone || user.telefone || "")}"`)}${UI.input("dataNascimento", "Data de nascimento", "date", `required value="${UI.escape(String(patient?.dataNascimento || "").slice(0, 10))}"`)}<div class="col-md-6"><label class="form-label" for="genero">Sexo / gênero cadastral</label><select class="form-select" name="genero" id="genero" required>${UI.option("", "Selecione")}${[
        ["M", "Masculino"],
        ["F", "Feminino"],
        ["Outro", "Outro"],
      ]
        .map(
          ([value, label]) =>
            `<option value="${value}" ${patient?.genero === value ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></div><fieldset class="col-12"><legend class="h6">Endereço (opcional)</legend><div class="row g-3">${[
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
            `maxlength="150" value="${UI.escape(patient?.endereco?.[key] || "")}"`,
          ),
        )
        .join(
          "",
        )}</div></fieldset><div class="col-12"><button type="submit" class="btn btn-primary">${patient ? "Salvar meus dados de paciente" : "Ativar meu cadastro de paciente"}</button></div></form></div></section>`
    : "";
  const path =
    user.role === "paciente"
      ? "pacientes"
      : user.role === "medico"
        ? "medicos"
        : null;
  const record =
    path && user.perfil?.id
      ? await API.request(`/${path}/${user.perfil.id}`)
      : user;
  UI.page(
    "Meu perfil",
    `<div class="card mb-4"><div class="card-body"><p>${UI.escape(user.email)} • ${UI.escape(user.role)}</p>${path || admin ? `<form id="profile" class="row g-3">${UI.input("nome", "Nome completo", "text", `required value="${UI.escape(record.nome)}"`)}${UI.input("telefone", "Telefone", "tel", `required value="${UI.escape(record.telefone || "")}"`)}<div class="col-12"><button type="submit" class="btn btn-primary">Salvar perfil</button></div></form>` : `<p>${UI.escape(user.nome)}</p>`}</div></div>${path ? `<a class="btn btn-outline-primary mb-4" href="/cadastro/editar/editar.html?tipo=${user.role}&id=${encodeURIComponent(user.perfil.id)}">Editar cadastro completo</a>` : ""}${patientForm}<div class="card"><div class="card-body"><h2 class="h5">Alterar senha</h2><form id="password" class="row g-3">${UI.input("atual", "Senha atual", "password", 'required autocomplete="current-password"')}${UI.input("nova", "Nova senha", "password", 'required minlength="8" maxlength="72" autocomplete="new-password"')}<div class="col-12"><button type="submit" class="btn btn-outline-primary">Atualizar senha</button></div></form></div></div>`,
  );
  const form = document.getElementById("profile");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(form, async () => {
      await API.request(
        admin ? "/auth/me/perfil" : `/${path}/${user.perfil.id}`,
        {
          method: admin ? "PATCH" : "PUT",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        },
      );
      await API.require();
      UI.message("Perfil atualizado.", "success");
    });
  });
  const ownPatient = document.getElementById("own-patient");
  ownPatient?.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(ownPatient, async () => {
      const data = Object.fromEntries(new FormData(ownPatient));
      data.telefone = data.telefonePaciente;
      delete data.telefonePaciente;
      data.endereco = {};
      for (const key of [
        "rua",
        "numero",
        "complemento",
        "bairro",
        "cidade",
        "estado",
        "cep",
      ]) {
        data.endereco[key] = data[`endereco_${key}`];
        delete data[`endereco_${key}`];
      }
      await API.request("/auth/me/paciente", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await showProfile();
      UI.message(
        "Cadastro de paciente salvo e vinculado à sua conta.",
        "success",
      );
    });
  });
  const password = document.getElementById("password");
  password.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.submit(password, async () => {
      await API.request("/auth/senha", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(password))),
      });
      password.reset();
      alert("Senha atualizada. Entre novamente.");
      API.logout();
    });
  });
};
