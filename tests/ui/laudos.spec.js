const { test, expect } = require("@playwright/test");
const path = require("node:path");
const ids = {
  report: "555555555555555555555555",
  patient: "111111111111111111111111",
  doctor: "222222222222222222222222",
  user: "aaaaaaaaaaaaaaaaaaaaaaaa",
};
async function fixture(page, role) {
  const usuario = {
    id: ids.user,
    nome: "Equipe de demonstração",
    email: "demo@example.test",
    role,
    perfil: {
      model: role === "medico" ? "Medico" : "Paciente",
      id: role === "medico" ? ids.doctor : ids.patient,
    },
  };
  await page.addInitScript(
    (usuario) =>
      sessionStorage.setItem(
        "posto.session.v2",
        JSON.stringify({ token: "test-only", usuario }),
      ),
    usuario,
  );
  let state = "nao_registrado";
  const history = [],
    requests = [],
    errors = [];
  const report = {
    _id: ids.report,
    paciente: { _id: ids.patient, nome: "Paciente de demonstração" },
    medico: {
      _id: ids.doctor,
      nome: "Profissional de demonstração",
      crm: "12345/SC",
    },
    titulo: "Laudo de demonstração",
    descricao: "Conteúdo fictício para demonstração da interface.",
    conclusao: "Documento utilizado exclusivamente nos testes.",
    status: "finalizado",
    publicadoEm: "2026-11-05T12:00:00Z",
    versao: 1,
  };
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const data = request.postDataJSON();
    requests.push({ path: url.pathname, data });
    if (url.pathname === "/api/auth/me")
      return route.fulfill({ json: { usuario } });
    if (url.pathname === "/api/auth/registration")
      return route.fulfill({ json: { publicRegistration: false } });
    if (url.pathname === "/api/auth/usuarios")
      return route.fulfill({
        json: {
          usuarios: [
            {
              id: ids.patient,
              nome: "Pessoa de demonstração",
              email: "paciente@example.test",
              role: "paciente",
              status: "ativo",
            },
          ],
        },
      });
    if (url.pathname.endsWith("/senha-temporaria"))
      return route.fulfill({
        json: {
          senhaTemporaria: "Credencial-ficticia-de-teste",
          expiraEm: "2026-11-06T12:00:00Z",
        },
      });
    if (url.pathname.endsWith("/distribuicao")) {
      if (request.method() === "POST") {
        state = data.situacao;
        history.unshift({
          ...data,
          data: "2026-11-05T12:00:00Z",
          responsavel: { nome: usuario.nome },
        });
      }
      return route.fulfill({
        json: request.method() === "POST" ? report : { movimentos: history },
      });
    }
    if (url.pathname.endsWith("/retificacoes"))
      return route.fulfill({
        status: 201,
        json: { ...report, status: "rascunho" },
      });
    if (url.pathname === `/api/laudos/${ids.report}`)
      return route.fulfill({
        json: { ...report, distribuicao: { situacao: state } },
      });
    if (url.pathname === "/api/laudos")
      return route.fulfill({
        json: [{ ...report, distribuicao: { situacao: state } }],
      });
    if (url.pathname === "/api/estatisticas")
      return route.fulfill({
        json: {
          exames: 0,
          atendimentos: 0,
          avaliacoes: 0,
          satisfacao: null,
          mensal: [],
        },
      });
    return route.fulfill({ json: [] });
  });
  return { requests, errors };
}
async function capture(page, name) {
  if (process.env.TCC_CAPTURE_DIR)
    await page.screenshot({
      path: path.join(process.env.TCC_CAPTURE_DIR, name + ".png"),
      fullPage: true,
    });
}
test("admin registra recebimento, disponibilidade e entrega sem repetir ação", async ({
  page,
}) => {
  const { requests, errors } = await fixture(page, "admin");
  await page.goto(`/laudo/detalhe.html?id=${ids.report}`);
  await page
    .getByRole("button", { name: "Registrar recebimento", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Disponibilizar para retirada" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Disponibilizar para retirada" })
    .click();
  await expect(page.getByLabel("Nome de quem recebeu")).toBeVisible();
  await page
    .getByLabel("Nome de quem recebeu")
    .fill("Responsável de demonstração");
  await page.getByLabel("Vínculo", { exact: true }).selectOption("responsavel");
  await page.getByRole("button", { name: "Confirmar entrega" }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar entrega" }),
  ).toHaveCount(0);
  await expect(page.locator("ol")).toContainText("Responsável de demonstração");
  expect(
    requests.filter((r) => r.data?.situacao).map((r) => r.data.situacao),
  ).toEqual(["recebido", "disponivel", "entregue"]);
  expect(errors).toEqual([]);
  await capture(page, "retirada-laudo");
});
test("médico cria rascunho de retificação pela interface", async ({ page }) => {
  const { requests, errors } = await fixture(page, "medico");
  await page.goto(`/laudo/detalhe.html?id=${ids.report}`);
  await page
    .getByLabel("Motivo da retificação")
    .fill("Correção de digitação na conclusão.");
  await capture(page, "retificacao-laudo");
  await page
    .getByRole("button", { name: "Criar rascunho de retificação" })
    .click();
  await expect(page).toHaveURL(/\/laudo\/laudo.html$/);
  expect(
    requests.some(
      (r) =>
        r.path.endsWith("/retificacoes") &&
        r.data.motivo === "Correção de digitação na conclusão.",
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("paciente vê laudo completo e situação sem controles administrativos em celular", async ({
  page,
}) => {
  const { errors } = await fixture(page, "paciente");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/laudo/detalhe.html?id=${ids.report}`);
  await expect(
    page.getByRole("heading", { name: "Laudo de demonstração" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Registrar recebimento" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Criar rascunho de retificação" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
  await capture(page, "laudo-celular");
});
test("recuperação administrativa limpa confirmação e não persiste credencial no navegador", async ({
  page,
}) => {
  await fixture(page, "admin");
  await page.goto("/administracao/administracao.html");
  await page.getByRole("button", { name: "Redefinir senha" }).click();
  await page
    .getByLabel("Confirme sua senha de administrador")
    .fill("Senha-ficticia-de-teste");
  await page.getByRole("button", { name: "Gerar senha temporária" }).click();
  await expect(page.locator("#temporary-password-result")).toContainText(
    "Credencial-ficticia-de-teste",
  );
  await expect(
    page.getByLabel("Confirme sua senha de administrador"),
  ).toHaveValue("");
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("Credencial-ficticia-de-teste");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator("#temporary-password-result")).toHaveCount(0);
});
test("capturas de entrada e página inicial usam somente dados fictícios", async ({
  page,
}) => {
  await fixture(page, "paciente");
  await page.goto("/login/login.html");
  await expect(
    page.getByRole("heading", { name: "Acesse sua conta" }),
  ).toBeVisible();
  await capture(page, "login");
  await page.goto("/index/index.html");
  await expect(page.locator("h1")).toBeVisible();
  await capture(page, "inicio");
});
