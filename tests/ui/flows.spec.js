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
      ...(role === "medico"
        ? {
            observacoes:
              "Preciso de acessibilidade <script>window.privateComment=true</script>",
          }
        : {}),
      medico: { _id: ids.doctor, nome: "Médico de teste" },
      data: "2026-09-21",
      hora: "10:00",
      status: "realizado",
    },
  ];
  const feedbacks = [];
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
    if (path === "/unidades/tipos")
      data = {
        tipos: ["posto_coleta", "ubs"],
        niveis: ["primario", "secundario", "terciario"],
      };
    else if (path === "/unidades")
      data = [
        {
          _id: "999999999999999999999999",
          nome: "Unidade de teste",
          tipo: "posto_coleta",
          nivel: "primario",
          ativo: true,
          servicos: [ids.specialty],
        },
      ];
    else if (path === "/relatorios/opcoes")
      data = require("../fixtures/report.json").options;
    else if (path === "/relatorios")
      data = require("../fixtures/report.json").report;
    else if (path === "/relatorios/pdf") {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="relatorio-geral.pdf"',
        },
        body: Buffer.from("%PDF-1.4\nInterface de teste\n%%EOF"),
      });
      return;
    } else if (path === "/auth/login") data = session;
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
          unidade: "999999999999999999999999",
          especialidades: [{ _id: ids.specialty, nome: "Clínica geral" }],
        },
      ];
    else if (path === "/pacientes/consultar-cpf") data = { encontrado: false };
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
    else if (path === "/feedback-sistema") {
      if (request.method() === "POST") {
        const row = {
          ...body,
          _id: "666666666666666666666666",
          usuario: { nome: "Pessoa de teste" },
          status: "novo",
          createdAt: new Date().toISOString(),
        };
        feedbacks.unshift(row);
        data = row;
      } else data = feedbacks;
    } else if (path.startsWith("/feedback-sistema/")) {
      Object.assign(feedbacks[0], { status: body.status });
      data = feedbacks[0];
    } else if (path === "/auditoria") data = { logs: [] };
    else data = { mensagem: "OK" };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return { requests, errors };
}
test("login por CPF usa API e não armazena senha", async ({ page }) => {
  const { requests, errors } = await mock(page, "paciente", false);
  await page.goto("/login/login.html");
  await page
    .getByLabel("E-mail ou CPF", { exact: true })
    .fill("123.456.789-00");
  await page.getByLabel("Senha", { exact: true }).fill("segredo123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Pessoa de teste" }),
  ).toBeVisible();
  expect(
    requests.some(
      (r) =>
        r.path === "/auth/login" &&
        r.body.senha === "segredo123" &&
        r.body.identificador === "123.456.789-00",
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
  await expect(page.locator('[name="senha"]')).toHaveCount(0);
  await page.getByLabel("CPF", { exact: true }).fill("12345678900");
  await page.getByLabel("Telefone").fill("48999999999");
  await page.getByLabel("Data de nascimento").fill("1990-01-01");
  await page.getByLabel("Sexo / gênero cadastral").selectOption("Outro");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.locator("#feedback")).toContainText("Cadastro salvo");
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
  await page.locator("[data-finalize]").click();
  await expect(page.getByRole("status")).toContainText("Laudo publicado");
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
    if (["admin", "super_admin"].includes(role))
      await page.getByLabel("Senha (mínimo 8 caracteres)").fill("senha12345");
    if (["paciente", "medico"].includes(role)) {
      await page.getByLabel("CPF", { exact: true }).fill("12345678900");
      await page.getByLabel("Telefone").fill("48999999999");
      await page.getByLabel("Data de nascimento").fill("1990-01-01");
      await page.getByLabel("Sexo / gênero cadastral").selectOption("Outro");
    }
    if (role === "medico") {
      await page.getByLabel("CRM / UF").fill("12345/SC");
      await page
        .getByLabel("Unidade de saúde", { exact: true })
        .selectOption("999999999999999999999999");
    }
    const previousRegistrations = requests.filter(
      (request) => request.path === "/auth/register",
    ).length;
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect
      .poll(
        () =>
          requests.filter((request) => request.path === "/auth/register")
            .length,
      )
      .toBe(previousRegistrations + 1);
    await expect(page.getByRole("status")).toContainText("Conta criada");
    expect(
      requests.filter((r) => r.path === "/auth/register").at(-1).body.role,
    ).toBe(role);
  }
  expect(errors).toEqual([]);
});

test("primeiro acesso direciona para troca de senha e confirma nova senha", async ({
  page,
}) => {
  const { requests } = await mock(page, "paciente");
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: { usuario: { ...user("paciente"), trocarSenha: true } },
    }),
  );
  await page.goto("/consultas/consultas.html");
  await expect(page).toHaveURL(/\/login\/trocar-senha.html/);
  await expect(
    page.getByRole("heading", { name: "Escolha sua nova senha" }),
  ).toBeVisible();
  await page
    .getByLabel("Senha atual (CPF no primeiro acesso)")
    .fill("12345678900");
  await page.getByLabel("Nova senha", { exact: true }).fill("Nova-senha-2026");
  await page.getByLabel("Confirme a nova senha").fill("Nova-senha-2026");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/login\/login.html/);
  expect(requests.find((r) => r.path === "/auth/senha").body).toEqual({
    atual: "12345678900",
    nova: "Nova-senha-2026",
  });
});

test("usuário avalia o sistema pelo celular e comentário permanece como texto", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "paciente");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/feedback/feedback.html");
  await page.getByLabel("Tipo de comentário").selectOption("avaliacao");
  await page.getByLabel("Nota", { exact: true }).selectOption("5");
  await page
    .getByLabel("Comentário", { exact: true })
    .fill("Fácil de usar <script>window.injected=true</script>");
  await page
    .getByRole("button", { name: "Enviar comentário", exact: true })
    .click();
  await expect(page.locator("#feedback")).toContainText("Comentário enviado");
  await expect(page.locator(".feedback-comment")).toContainText("<script>");
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  expect(await page.locator("#feedback-list script").count()).toBe(0);
  await expect(
    page.getByRole("heading", { name: "Meus comentários" }),
  ).toBeVisible();
  expect(await page.locator(".feedback-status").count()).toBe(0);
  expect(
    requests.some(
      (r) =>
        r.path === "/feedback-sistema" &&
        r.method === "POST" &&
        r.body.nota === 5,
    ),
  ).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("administrador acompanha problema enviado ao sistema", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "admin");
  await page.goto("/feedback/feedback.html");
  await page.getByLabel("Tipo de comentário").selectOption("problema");
  await page
    .getByLabel("Comentário", { exact: true })
    .fill("A página demora para carregar");
  await page
    .getByRole("button", { name: "Enviar comentário", exact: true })
    .click();
  await expect(page.locator(".feedback-status")).toBeVisible();
  await page.locator(".feedback-status select").selectOption("em_analise");
  await page.getByRole("button", { name: "Atualizar andamento" }).click();
  await expect(page.locator("#feedback")).toContainText("Andamento atualizado");
  await expect(page.locator("#feedback-list .badge")).toHaveText("Em análise");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(
    requests.some(
      (r) => r.method === "PATCH" && r.body.status === "em_analise",
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("médico lê o comentário privado do agendamento sem executar conteúdo HTML", async ({
  page,
}) => {
  const { errors } = await mock(page, "medico");
  await page.goto("/consultas/consultas.html");
  await expect(
    page.getByRole("heading", { name: "Comentário enviado no agendamento" }),
  ).toBeVisible();
  await expect(page.locator(".booking-comment")).toContainText(
    "Preciso de acessibilidade <script>",
  );
  expect(await page.locator(".booking-comment script").count()).toBe(0);
  expect(await page.evaluate(() => window.privateComment)).toBeUndefined();
  expect(errors).toEqual([]);
});

test("central recebe comentário geral e mantém avaliação após a consulta", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "paciente");
  await page.goto("/feedback/feedback.html");
  await expect(
    page.getByRole("heading", { name: "Central de comentários", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Comentário", { exact: true })
    .fill("Gostei da organização do atendimento");
  await page
    .getByRole("button", { name: "Enviar comentário", exact: true })
    .click();
  await expect(page.locator("#feedback")).toContainText("Comentário enviado");
  expect(
    requests.some(
      (r) =>
        r.path === "/feedback-sistema" &&
        r.method === "POST" &&
        r.body.tipo === "outro" &&
        r.body.nota === undefined,
    ),
  ).toBeTruthy();
  await page.getByRole("link", { name: "Ir para Consultas" }).click();
  await expect(page.locator(".rating-form")).toHaveCount(2);
  const form = page.locator('.rating-form[data-type="consulta"]');
  await form.locator('select[name="nota"]').selectOption("5");
  await form
    .locator('textarea[name="comentario"]')
    .fill("Atendimento atencioso");
  await form.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.locator("#feedback")).toContainText(
    "Obrigado pela sua avaliação",
  );
  expect(
    requests.some(
      (r) =>
        r.path.endsWith("/avaliacao") &&
        r.method === "POST" &&
        r.body.comentario === "Atendimento atencioso",
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("administrador filtra relatório e baixa PDF em tela pequena", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/relatorios/relatorios.html");
  await expect(
    page.getByRole("button", { name: "Salvar como PDF" }),
  ).toBeDisabled();
  await page.getByLabel("Data inicial", { exact: true }).fill("2026-11-01");
  await page.getByLabel("Data final", { exact: true }).fill("2026-11-22");
  await page
    .getByLabel("Médico", { exact: true })
    .selectOption("333333333333333333333333");
  await page
    .getByLabel("Situação da consulta", { exact: true })
    .selectOption("realizado");
  await page
    .getByRole("button", { name: "Gerar relatório", exact: true })
    .click();
  await expect(page.locator("#report-result")).toContainText("Sem avaliações");
  await expect(
    page.getByRole("button", { name: "Salvar como PDF" }),
  ).toBeEnabled();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar como PDF" }).click();
  expect((await downloading).suggestedFilename()).toMatch(
    /relatorio-geral-.*\.pdf/,
  );
  await expect(page.locator("#feedback")).toContainText("PDF gerado");
  const queries = requests.filter(
    (r) => r.path === "/relatorios" || r.path === "/relatorios/pdf",
  );
  expect(queries).toHaveLength(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByLabel("Situação da consulta", { exact: true })
    .selectOption("cancelado");
  await expect(
    page.getByRole("button", { name: "Salvar como PDF" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

for (const role of ["paciente", "medico"]) {
  test(`${role} não acessa a área de relatórios`, async ({ page }) => {
    const { requests } = await mock(page, role);
    await page.goto("/relatorios/relatorios.html");
    await expect(page.locator("#feedback")).toContainText(
      "Seu perfil não tem acesso",
    );
    await expect(page.locator("#report-filters")).toHaveCount(0);
    expect(requests.some((r) => r.path.startsWith("/relatorios"))).toBeFalsy();
  });
}

test("paciente agenda exame pela unidade sem selecionar profissional", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "paciente");
  await page.route("**/api/servicos**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          _id: ids.specialty,
          nome: "Hemograma",
          tipo: "exame",
          especialidade: ids.specialty,
        },
      ]),
    }),
  );
  await page.goto(
    `/agendamento/agendamento.html?servico=${ids.specialty}&unidade=999999999999999999999999`,
  );
  await expect(
    page.getByLabel("Unidade de saúde", { exact: true }),
  ).toHaveValue("999999999999999999999999");
  await expect(page.getByLabel("Profissional", { exact: true })).toBeHidden();
  await page
    .getByLabel("Data", { exact: true })
    .fill(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel("Data", { exact: true }).blur();
  await expect(page.getByLabel("Horário disponível")).toBeEnabled();
  await page.getByLabel("Horário disponível").selectOption("09:00");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page).toHaveURL(/consultas\/consultas.html/);
  const request = requests.find(
    (r) => r.path === "/agendamentos" && r.method === "POST",
  );
  expect(request.body.unidade).toBe("999999999999999999999999");
  expect(request.body.medico).toBeUndefined();
  expect(errors).toEqual([]);
});

test("administrador cadastra unidade com tipo, nível e oferta de exames", async ({
  page,
}) => {
  const { requests, errors } = await mock(page, "admin");
  await page.goto("/unidades/unidades.html");
  await page
    .getByText("Cadastrar nova unidade de saúde", { exact: true })
    .click();
  const form = page.locator(".unit-form:not([data-id])");
  await form
    .getByLabel("Nome da unidade", { exact: true })
    .fill("Posto de coleta de teste");
  await form
    .getByLabel("Tipo de unidade", { exact: true })
    .selectOption("posto_coleta");
  await form
    .getByLabel("Nível de atendimento", { exact: true })
    .selectOption("secundario");
  await form.locator('[name="servicos"]').selectOption(ids.specialty);
  await form
    .getByRole("button", { name: "Cadastrar unidade", exact: true })
    .click();
  await expect
    .poll(
      () =>
        requests.filter((r) => r.path === "/unidades" && r.method === "POST")
          .length,
    )
    .toBe(1);
  const request = requests.find(
    (r) => r.path === "/unidades" && r.method === "POST",
  );
  expect(request.body.nivel).toBe("secundario");
  expect(request.body.servicos).toEqual([ids.specialty]);
  expect(errors).toEqual([]);
});
