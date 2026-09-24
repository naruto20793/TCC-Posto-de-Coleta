const { test, expect } = require("@playwright/test");
const ids = {
  patient: "111111111111111111111111",
  doctor: "222222222222222222222222",
  specialty: "333333333333333333333333",
  appointment: "444444444444444444444444",
  laudo: "555555555555555555555555",
};
function user(role) {
  return {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    nome: "Pessoa de teste",
    email: "teste@example.test",
    role,
    status: "ativo",
    perfil: {
      model: role === "medico" ? "Medico" : "Paciente",
      id: role === "medico" ? ids.doctor : ids.patient,
    },
  };
}
async function mock(page, role, logged = true) {
  const session = { token: "test-token", usuario: user(role) };
  if (logged)
    await page.addInitScript(
      (value) =>
        sessionStorage.setItem("posto.session.v2", JSON.stringify(value)),
      session,
    );
  const requests = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const appointments = [
    {
      _id: ids.appointment,
      paciente: { _id: ids.patient, nome: "Paciente de teste" },
      medico: { _id: ids.doctor, nome: "Médico de teste" },
      data: "2026-09-21",
      hora: "10:00",
      status: "realizado",
    },
  ];
  const laudos = [
    {
      _id: ids.laudo,
      agendamento: ids.appointment,
      paciente: { nome: "Paciente de teste" },
      medico: { nome: "Médico de teste" },
      titulo: "Laudo de teste",
      descricao: "Descrição segura <script>window.injected=true</script>",
      conclusao: "Conclusão",
      status: role === "medico" ? "rascunho" : "finalizado",
    },
  ];
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname.slice(4);
    const body = request.postDataJSON();
    requests.push({ path, method: request.method(), body });
    let data;
    if (path === "/auth/login") data = session;
    else if (path === "/auth/registration") data = { publicRegistration: true };
    else if (path === "/auth/me") data = { usuario: user(role) };
    else if (path === "/auth/usuarios") data = { usuarios: [user(role)] };
    else if (path === "/auth/register") data = { usuario: user("paciente") };
    else if (path === "/especialidades")
      data = [{ _id: ids.specialty, nome: "Clínica geral" }];
    else if (path === "/medicos")
      data = [
        {
          _id: ids.doctor,
          nome: "Médico de teste",
          crm: "12345/SC",
          especialidades: [{ _id: ids.specialty, nome: "Clínica geral" }],
        },
      ];
    else if (path.startsWith("/pacientes/"))
      data = {
        _id: ids.patient,
        nome: "Paciente de teste",
        telefone: "48999999999",
      };
    else if (path === "/pacientes")
      data = [
        {
          _id: ids.patient,
          nome: "Paciente de teste",
          email: "p@example.test",
          telefone: "48999999999",
        },
      ];
    else if (path.startsWith("/agendamentos/disponibilidade"))
      data = { horarios: ["09:00", "09:30"], duracao: 30 };
    else if (path === "/agendamentos") {
      if (request.method() === "POST") {
        const appointment = {
          ...appointments[0],
          data: body.data,
          hora: body.hora,
          status: "agendado",
        };
        appointments.push(appointment);
        data = appointment;
      } else data = appointments;
    } else if (path === "/laudos") data = laudos;
    else if (path.startsWith("/laudos/")) {
      Object.assign(laudos[0], body);
      data = laudos[0];
    } else if (path === "/servicos")
      data = [
        {
          _id: ids.specialty,
          nome: "Coleta laboratorial",
          descricao: "Atendimento na unidade",
          valor: 0,
        },
      ];
    else if (path === "/auditoria") data = { logs: [] };
    else data = { mensagem: "OK" };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return { requests, errors };
}
test("login usa API e não armazena senha", async ({ page }) => {
  const { requests, errors } = await mock(page, "paciente", false);
  await page.goto("/login/login.html");
  await page.getByLabel("Email", { exact: true }).fill("teste@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("segredo123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Pessoa de teste" }),
  ).toBeVisible();
  expect(
    requests.some(
      (r) => r.path === "/auth/login" && r.body.senha === "segredo123",
    ),
  ).toBeTruthy();
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("segredo123");
  expect(errors).toEqual([]);
});
test("paciente agenda consultando disponibilidade na API", async ({ page }) => {
  const { requests, errors } = await mock(page, "paciente");
  await page.goto("/agendamento/agendamento.html");
  await page
    .getByLabel("Profissional", { exact: true })
    .selectOption(ids.doctor);
  await page
    .getByLabel("Data", { exact: true })
    .fill(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel("Horário disponível").selectOption("09:00");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(
    page.getByRole("heading", { name: "Consultas", exact: true }),
  ).toBeVisible();
  const body = requests.find(
    (r) => r.path === "/agendamentos" && r.method === "POST",
  ).body;
  expect(body.medico).toBe(ids.doctor);
  expect(body.hora).toBe("09:00");
  expect(body.paciente).toBeUndefined();
  expect(errors).toEqual([]);
});
test("admin salva cadastro completo via API", async ({ page }) => {
  const { requests, errors } = await mock(page, "admin");
  await page.goto("/cadastro/paciente/paciente.html");
  await page.getByLabel("Nome completo").fill("Paciente cadastrado");
  await page.getByLabel("Email de acesso").fill("novo@example.test");
  await page.getByLabel(/Senha inicial/).fill("segredo123");
  await page.getByLabel("CPF", { exact: true }).fill("12345678900");
  await page.getByLabel("Telefone").fill("48999999999");
  await page.getByLabel("Data de nascimento").fill("1990-01-01");
  await page.getByLabel("Sexo / gênero cadastral").selectOption("Outro");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toContainText("Cadastro salvo");
  const body = requests.find((r) => r.path === "/auth/register").body;
  expect(body.role).toBe("paciente");
  expect(body.cpf).toBe("12345678900");
  expect(errors).toEqual([]);
});
test("médico finaliza laudo e conteúdo clínico é exibido como texto", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "medico");
  await page.goto("/laudo/laudo.html");
  await expect(page.getByText("Laudo de teste", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Finalizar e liberar" }).click();
  await expect(page.getByRole("status")).toContainText("Laudo liberado");
  expect(
    requests.some((r) => r.method === "PUT" && r.body.status === "finalizado"),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("telas de paciente carregam em celular sem overflow horizontal", async ({
  page,
}) => {
  const { errors } = await mock(page, "paciente");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/index/index.html",
    "/agendamento/agendamento.html",
    "/consultas/consultas.html",
    "/laudo/laudo.html",
    "/perfil/paciente/perfil.html",
    "/servicos/servicos.html",
    "/profissionais/profissionais.html",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
test("visitante cria conta em cada nível pela tela de teste", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "paciente", false);
  await page.goto("/login/login.html");
  await page.getByRole("link", { name: "Criar conta para teste" }).click();
  await expect(
    page.getByRole("heading", { name: "Criar conta para teste" }),
  ).toBeVisible();
  for (const role of ["paciente", "medico", "admin", "super_admin"]) {
    await page.locator("#role").selectOption(role);
    await page.getByLabel("Nome completo").fill("Pessoa de teste");
    await page.getByLabel("Email de acesso").fill(`${role}@example.test`);
    await page.getByLabel("Senha (mínimo 8 caracteres)").fill("senha12345");
    if (["paciente", "medico"].includes(role)) {
      await page.getByLabel("CPF", { exact: true }).fill("12345678900");
      await page.getByLabel("Telefone").fill("48999999999");
      await page.getByLabel("Data de nascimento").fill("1990-01-01");
      await page.getByLabel("Sexo / gênero cadastral").selectOption("Outro");
    }
    if (role === "medico") await page.getByLabel("CRM / UF").fill("12345/SC");
    const previousRegistrations = requests.filter(
      (request) => request.path === "/auth/register",
    ).length;
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect
      .poll(
        () => requests.filter((request) => request.path === "/auth/register").length,
      )
      .toBe(previousRegistrations + 1);
    await expect(page.getByRole("status")).toContainText("Conta criada");
    expect(
      requests.filter((r) => r.path === "/auth/register").at(-1).body.role,
    ).toBe(role);
  }
  expect(errors).toEqual([]);
});
