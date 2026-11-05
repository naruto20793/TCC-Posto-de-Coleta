process.env.CRYPTO_KEY = "e2e-only-key-not-for-production-2026";
process.env.NODE_ENV = "test";
process.env.ALLOW_PUBLIC_TEST_REGISTRATION = "false";
const { test, expect } = require("@playwright/test");
const { once } = require("node:events");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Usuario = require("../../backend/models/Usuario");
const Agendamento = require("../../backend/models/Agendamento");
const Laudo = require("../../backend/models/Laudo");
const { indexes } = require("../../backend/scripts/database-maintenance");
let mongo, server, base, doctorId, patientId;
const password = "E2E-password-only-2026";
test.beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri(), { autoIndex: false });
  await indexes();
  const app = require("../../backend/app");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  await Usuario.create({
    nome: "Admin de teste",
    email: "admin@example.test",
    senha: password,
    role: "super_admin",
  });
});
test.afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
async function login(page, email, senha = password) {
  await page.goto(base + "/login/login.html");
  await page.getByLabel("E-mail ou CPF", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/(index\/index|login\/trocar-senha).html$/);
}
async function token(page) {
  return page.evaluate(
    () => JSON.parse(sessionStorage.getItem("posto.session.v2")).token,
  );
}
test("cadastro, agenda, atendimento, publicação e retirada com API e MongoDB reais isolados", async ({
  page,
  request,
}) => {
  await login(page, "admin@example.test");
  const adminToken = await token(page);
  const headers = { Authorization: `Bearer ${adminToken}` };
  const specialtyResponse = await request.post(base + "/api/especialidades", {
    headers,
    data: { nome: "Clínica de teste" },
  });
  expect(specialtyResponse.status()).toBe(201);
  const specialty = (await specialtyResponse.json())._id;
  for (const [role, email, cpf] of [
    ["medico", "medico@example.test", "11122233344"],
    ["paciente", "paciente@example.test", "22233344455"],
  ]) {
    const response = await request.post(base + "/api/auth/register", {
      headers,
      data: {
        nome: role === "medico" ? "Profissional fictício" : "Paciente fictício",
        role,
        email,
        cpf,
        telefone: "48999999999",
        dataNascimento: "1990-01-01",
        genero: "Outro",
        ...(role === "medico"
          ? { crm: "987/SC", especialidades: [specialty] }
          : {}),
      },
    });
    expect(response.status()).toBe(201);
    if (role === "medico") doctorId = (await response.json()).usuario.perfil.id;
    else patientId = (await response.json()).usuario.perfil.id;
    const context = await page.context().browser().newContext();
    const first = await context.newPage();
    await login(first, email, cpf);
    await first.getByLabel("Senha atual (CPF no primeiro acesso)").fill(cpf);
    await first.getByLabel("Nova senha", { exact: true }).fill(password);
    await first.getByLabel("Confirme a nova senha").fill(password);
    first.on("dialog", (d) => d.accept());
    await first.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(first).toHaveURL(/\/login\/login.html$/);
    await context.close();
  }
  await login(page, "paciente@example.test");
  await page.goto(base + "/agendamento/agendamento.html");
  await page.getByLabel("Profissional", { exact: true }).selectOption(doctorId);
  const date = new Date(Date.now() + 7 * 86400000);
  while ([0, 6].includes(date.getUTCDay()))
    date.setUTCDate(date.getUTCDate() + 1);
  await page
    .getByLabel("Data", { exact: true })
    .fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Horário disponível").selectOption("09:00");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.locator("h1")).toHaveText("Consultas");
  const booking = await Agendamento.findOne({
    paciente: patientId,
    medico: doctorId,
  });
  expect(booking).toBeTruthy();
  // Somente o relógio do cenário é preparado diretamente: a consulta agendada passa a uma data passada.
  // Nenhum endpoint de teste é adicionado à aplicação nem há simulação da API.
  booking.data = new Date("2025-01-06");
  await booking.save();
  await login(page, "medico@example.test");
  await page.goto(base + "/consultas/consultas.html");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  page.on("dialog", (d) => d.accept("1"));
  await page.getByRole("button", { name: "Marcar como realizada" }).click();
  await expect(page.locator(".badge")).toContainText("realizado");
  await page.goto(base + "/laudo/laudo.html");
  await page.getByLabel("Consulta realizada").selectOption(booking.id);
  await page
    .getByLabel("Título", { exact: true })
    .fill("Laudo do fluxo completo");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Conteúdo clínico fictício de teste.");
  await page
    .getByRole("button", { name: "Salvar rascunho", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Rascunho salvo");
  const draft = await Laudo.findOne({ agendamento: booking._id });
  await page
    .getByRole("button", { name: "Publicar laudo", exact: true })
    .last()
    .click();
  await expect(page.getByRole("status")).toContainText("Laudo publicado");
  await login(page, "paciente@example.test");
  await page.goto(`${base}/laudo/detalhe.html?id=${draft.id}`);
  await expect(page.locator("h1")).toHaveText("Laudo do fluxo completo");
  await login(page, "admin@example.test");
  await page.goto(`${base}/laudo/detalhe.html?id=${draft.id}`);
  await page.getByRole("button", { name: "Registrar recebimento" }).click();
  await page
    .getByRole("button", { name: "Disponibilizar para retirada" })
    .click();
  await page.getByLabel("Nome de quem recebeu").fill("Paciente fictício");
  await page.getByLabel("Vínculo", { exact: true }).selectOption("paciente");
  await page.getByRole("button", { name: "Confirmar entrega" }).click();
  await expect(page.locator("ol")).toContainText("Paciente fictício");
  expect((await Laudo.findById(draft.id)).distribuicao.situacao).toBe(
    "entregue",
  );
});
