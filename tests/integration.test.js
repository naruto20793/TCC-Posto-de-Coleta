const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Usuario = require("../backend/models/Usuario");
const Paciente = require("../backend/models/Paciente");
const Medico = require("../backend/models/Medico");
const Agendamento = require("../backend/models/Agendamento");
const Laudo = require("../backend/models/Laudo");
const Especialidade = require("../backend/models/Especialidade");
const {
  indexes,
  migrate,
  planMigration,
} = require("../backend/scripts/database-maintenance");
const app = require("../backend/app");
let mongo,
  server,
  base,
  admin,
  doctor,
  patient,
  other,
  specialty,
  doctorId,
  patientId,
  otherId;
const password = "Test-password-2026";
async function api(path, method = "GET", body, token) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}
async function login(email) {
  const r = await api("/auth/login", "POST", { email, senha: password });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.token;
}
function profile(role, suffix, cpf) {
  return {
    nome: `Pessoa ${suffix}`,
    email: `${suffix}@example.test`,
    senha: password,
    role,
    cpf,
    telefone: "48999999999",
    dataNascimento: "1990-01-01",
    genero: "Outro",
    ...(role === "medico"
      ? { crm: "12345/SC", especialidades: [specialty] }
      : {}),
  };
}
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri(), { autoIndex: false });
  await indexes();
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  await Usuario.create({
    nome: "Admin",
    email: "admin@example.test",
    senha: password,
    role: "super_admin",
  });
  admin = await login("admin@example.test");
  let r = await api(
    "/especialidades",
    "POST",
    { nome: "Clínica geral" },
    admin,
  );
  assert.equal(r.status, 201);
  specialty = r.body._id;
  for (const [role, suffix, cpf] of [
    ["medico", "doctor", "11122233344"],
    ["paciente", "patient", "22233344455"],
    ["paciente", "other", "33344455566"],
  ]) {
    r = await api("/auth/register", "POST", profile(role, suffix, cpf), admin);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    if (suffix === "doctor") doctorId = r.body.usuario.perfil.id;
    if (suffix === "patient") patientId = r.body.usuario.perfil.id;
    if (suffix === "other") otherId = r.body.usuario.perfil.id;
  }
  doctor = await login("doctor@example.test");
  patient = await login("patient@example.test");
  other = await login("other@example.test");
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test("cadastro é persistido com hash, vínculo único e sem senha no perfil", async () => {
  const u = await Usuario.findOne({ email: "patient@example.test" }).select(
    "+senha",
  );
  assert.notEqual(u.senha, password);
  assert.equal(await bcrypt.compare(password, u.senha), true);
  const p = await Paciente.findById(patientId).select("+senha");
  assert.equal(p.senha, undefined);
  assert.equal(u.perfil.id.toString(), p.id);
});
test("conflito de email desfaz também a criação do perfil", async () => {
  const count = await Paciente.countDocuments();
  const data = profile("paciente", "patient", "44455566677");
  assert.equal((await api("/auth/register", "POST", data, admin)).status, 409);
  assert.equal(await Paciente.countDocuments(), count);
});
test("paciente não acessa outro perfil, cria conta ou eleva privilégios", async () => {
  assert.equal(
    (await api(`/pacientes/${otherId}`, "GET", null, patient)).status,
    404,
  );
  assert.equal(
    (
      await api(
        "/auth/register",
        "POST",
        profile("admin", "intruder", "55566677788"),
        patient,
      )
    ).status,
    403,
  );
  const rows = await api("/pacientes", "GET", null, patient);
  assert.equal(rows.body.length, 1);
  await api(
    `/pacientes/${patientId}`,
    "PUT",
    { nome: "Paciente atualizado", role: "super_admin", ativo: false },
    patient,
  );
  assert.equal(
    (await Usuario.findOne({ email: "patient@example.test" })).role,
    "paciente",
  );
  assert.equal((await Paciente.findById(patientId)).ativo, true);
});
test("admin comum não pode criar super_admin", async () => {
  await Usuario.create({
    nome: "Operador",
    email: "operator@example.test",
    senha: password,
    role: "admin",
  });
  const token = await login("operator@example.test");
  assert.equal(
    (
      await api(
        "/auth/register",
        "POST",
        {
          nome: "Escalada",
          email: "e@example.test",
          senha: password,
          role: "super_admin",
        },
        token,
      )
    ).status,
    403,
  );
});
test("bloqueio temporário expira e restaura acesso; login inválido é rejeitado", async () => {
  assert.equal(
    (
      await api("/auth/login", "POST", {
        email: "patient@example.test",
        senha: "errada",
      })
    ).status,
    401,
  );
  await Usuario.updateOne(
    { email: "patient@example.test" },
    {
      $set: {
        status: "bloqueado",
        bloqueadoAte: new Date(Date.now() - 1000),
        loginAttempts: 5,
      },
    },
  );
  patient = await login("patient@example.test");
  assert.equal((await api("/auth/me", "GET", null, patient)).status, 200);
});
let appointment;
test("duas reservas concorrentes no mesmo horário produzem 201 e 409", async () => {
  const day = new Date(Date.now() + 4 * 86400000);
  while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
  const body = {
    medico: doctorId,
    data: day.toISOString().slice(0, 10),
    hora: "09:00",
  };
  const results = await Promise.all([
    api("/agendamentos", "POST", body, patient),
    api("/agendamentos", "POST", body, other),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  appointment = results.find((r) => r.status === 201).body;
  const availability = await api(
    `/agendamentos/disponibilidade?medico=${doctorId}&data=${body.data}`,
    "GET",
    null,
    patient,
  );
  assert.equal(availability.body.horarios.includes("09:00"), false);
});
test("proprietário é determinado pela sessão e paciente não altera conclusão", async () => {
  const target = appointment.paciente._id === patientId ? other : patient;
  assert.equal(
    (await api(`/agendamentos/${appointment._id}`, "GET", null, target)).status,
    404,
  );
  const owner = appointment.paciente._id === patientId ? patient : other;
  assert.equal(
    (
      await api(
        `/agendamentos/${appointment._id}`,
        "PUT",
        { status: "realizado" },
        owner,
      )
    ).status,
    403,
  );
});
test("cancelamento mantém histórico e libera horário", async () => {
  const owner = appointment.paciente._id === patientId ? patient : other;
  assert.equal(
    (await api(`/agendamentos/${appointment._id}`, "DELETE", null, owner))
      .status,
    200,
  );
  assert.equal(
    (await Agendamento.findById(appointment._id)).status,
    "cancelado",
  );
  const r = await api(
    "/agendamentos",
    "POST",
    {
      medico: doctorId,
      paciente: otherId,
      data: appointment.data.slice(0, 10),
      hora: appointment.hora,
    },
    patient,
  );
  assert.equal(r.status, 201);
  assert.equal(r.body.paciente._id, patientId);
});
test("médico emite laudo, paciente só vê após finalização, edição final é bloqueada", async () => {
  const a = await Agendamento.create({
    paciente: patientId,
    medico: doctorId,
    data: "2025-01-06",
    hora: "10:00",
    status: "realizado",
  });
  const r = await api(
    "/laudos",
    "POST",
    { agendamento: a.id, titulo: "Resultado", descricao: "Descrição de teste" },
    doctor,
  );
  assert.equal(r.status, 201);
  assert.equal(
    (await api(`/laudos/${r.body._id}`, "GET", null, patient)).status,
    404,
  );
  assert.equal(
    (
      await api(
        `/laudos/${r.body._id}`,
        "PUT",
        { status: "finalizado" },
        doctor,
      )
    ).status,
    200,
  );
  assert.equal(
    (await api(`/laudos/${r.body._id}`, "GET", null, patient)).status,
    200,
  );
  assert.equal(
    (await api(`/laudos/${r.body._id}`, "GET", null, other)).status,
    404,
  );
  assert.equal(
    (
      await api(
        `/laudos/${r.body._id}`,
        "PUT",
        { descricao: "alterado" },
        doctor,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        "/laudos",
        "POST",
        { agendamento: a.id, titulo: "Inválido", descricao: "x" },
        patient,
      )
    ).status,
    403,
  );
});
test("disponibilidade não vaza nomes de pacientes", async () => {
  const r = await api(
    `/agendamentos/disponibilidade?medico=${doctorId}&data=2028-02-29`,
    "GET",
    null,
    patient,
  );
  assert.deepEqual(Object.keys(r.body).sort(), ["duracao", "horarios"]);
});
test("migração seca preserva dados e migração aplicada mantém hash bcrypt", async () => {
  const hash = await bcrypt.hash(password, 10);
  const p = await Paciente.create({
    nome: "Legado",
    email: "legacy@example.test",
    cpf: "66677788899",
    telefone: "48999999999",
    dataNascimento: "1980-01-01",
    genero: "Outro",
    senha: hash,
  });
  const plan = await planMigration();
  assert.equal(plan.errors.length, 0, JSON.stringify(plan.errors));
  await migrate(false);
  assert.equal(await Usuario.countDocuments({ email: p.email }), 0);
  await migrate(true);
  const token = await login(p.email);
  assert.equal((await api("/auth/me", "GET", null, token)).status, 200);
  assert.equal(
    (await Usuario.findOne({ email: p.email }).select("+senha")).senha,
    hash,
  );
});
test("troca de senha invalida tokens antigos", async () => {
  const r = await api(
    "/auth/senha",
    "PATCH",
    { atual: password, nova: "New-password-2026" },
    patient,
  );
  assert.equal(r.status, 200);
  assert.equal((await api("/auth/me", "GET", null, patient)).status, 401);
});
test("visitante em desenvolvimento cria e autentica contas de todos os níveis", async () => {
  const config = await api("/auth/registration");
  assert.equal(config.body.publicRegistration, true);
  for (const [role, cpf] of [
    ["paciente", "77788899900"],
    ["medico", "88899900011"],
    ["admin", "99900011122"],
    ["super_admin", "00011122233"],
  ]) {
    const payload = profile(role, `public-${role}`, cpf);
    if (role === "medico") {
      payload.crm = "99999/SC";
      payload.especialidades = [];
    }
    const created = await api("/auth/register", "POST", payload);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.usuario.role, role);
    const token = await login(payload.email);
    assert.equal(
      (await api("/auth/me", "GET", null, token)).body.usuario.role,
      role,
    );
  }
});
test("cadastro público permanece fechado em produção mesmo com flag ligada", async () => {
  const previousMode = process.env.NODE_ENV,
    previousFlag = process.env.ALLOW_PUBLIC_TEST_REGISTRATION;
  try {
    process.env.NODE_ENV = "production";
    process.env.ALLOW_PUBLIC_TEST_REGISTRATION = "true";
    assert.equal(
      (await api("/auth/registration")).body.publicRegistration,
      false,
    );
    assert.equal(
      (
        await api("/auth/register", "POST", {
          nome: "Intruso",
          email: "blocked@example.test",
          senha: password,
          role: "super_admin",
        })
      ).status,
      401,
    );
    assert.equal(
      await Usuario.countDocuments({ email: "blocked@example.test" }),
      0,
    );
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    if (previousFlag === undefined)
      delete process.env.ALLOW_PUBLIC_TEST_REGISTRATION;
    else process.env.ALLOW_PUBLIC_TEST_REGISTRATION = previousFlag;
  }
});
