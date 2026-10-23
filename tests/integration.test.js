process.env.CRYPTO_KEY = "integration-only-key-not-for-production-2026";
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
async function login(email, senha = password) {
  const r = await api("/auth/login", "POST", { email, senha });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.token;
}
async function initialize(email, cpf) {
  const token = await login(email, cpf);
  const changed = await api(
    "/auth/senha",
    "PATCH",
    { atual: cpf, nova: password },
    token,
  );
  assert.equal(changed.status, 200, JSON.stringify(changed.body));
  return login(email);
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
    const initialized = await initialize(`${suffix}@example.test`, cpf);
    if (suffix === "doctor") doctor = initialized;
    if (suffix === "patient") patient = initialized;
    if (suffix === "other") other = initialized;
  }
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
  assert.deepEqual(Object.keys(r.body).sort(), [
    "duracao",
    "horarios",
    "mensagem",
  ]);
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
    const token = ["paciente", "medico"].includes(role)
      ? await initialize(payload.email, cpf)
      : await login(payload.email);
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

test("campos clínicos são criptografados no banco e legíveis só após hidratação", async () => {
  const a = await Agendamento.create({
    paciente: patientId,
    medico: doctorId,
    data: "2025-01-06",
    hora: "11:00",
    status: "realizado",
    observacoes: "Sintomas privados",
  });
  const raw = await Agendamento.collection.findOne({ _id: a._id });
  assert.ok(raw.observacoes.startsWith("enc:v1:"));
  assert.equal(a.observacoes, "Sintomas privados");
  const loaded = await Agendamento.findById(a.id);
  assert.equal(loaded.observacoes, "Sintomas privados");
  loaded.status = "falta";
  await loaded.save();
  assert.equal(
    (await Agendamento.collection.findOne({ _id: a._id })).observacoes,
    raw.observacoes,
  );
  const laudo = await Laudo.create({
    paciente: patientId,
    medico: doctorId,
    titulo: "Exame privado",
    descricao: "Diagnóstico privado",
    resultados: "Normal",
  });
  assert.equal(laudo.descricao, "Diagnóstico privado");
  assert.ok(
    (await Laudo.collection.findOne({ _id: laudo._id })).descricao.startsWith(
      "enc:v1:",
    ),
  );
  const l = await Laudo.findById(laudo.id);
  l.descricao = "Novo diagnóstico";
  await l.save();
  assert.equal((await Laudo.findById(l.id)).descricao, "Novo diagnóstico");
  await assert.rejects(
    Laudo.updateOne(
      { _id: l._id },
      { $set: { descricao: "texto sem proteção" } },
    ),
    /save/,
  );
  await assert.rejects(
    Laudo.insertMany([
      { paciente: patientId, medico: doctorId, titulo: "x", descricao: "x" },
    ]),
    /criptografia/,
  );
  const p = await Paciente.findById(patientId);
  p.historicoMedico.alergias = ["Penicilina"];
  await p.save();
  const stored = await Paciente.collection.findOne({ _id: p._id });
  assert.ok(stored.historicoMedico.alergias[0].startsWith("enc:v1:"));
  assert.deepEqual(
    [...(await Paciente.findById(p.id)).historicoMedico.alergias],
    ["Penicilina"],
  );
});
test("migração clínica é idempotente e conferência não altera documentos", async () => {
  const { migrateClinical } = require("../backend/scripts/encrypt-clinical");
  const result = await Laudo.collection.insertOne({
    paciente: new mongoose.Types.ObjectId(patientId),
    medico: new mongoose.Types.ObjectId(doctorId),
    titulo: "Legado privado",
    descricao: "Texto antigo",
    status: "rascunho",
  });
  const dry = await migrateClinical(false);
  assert.equal(dry.laudos, 1);
  assert.equal(
    (await Laudo.collection.findOne({ _id: result.insertedId })).descricao,
    "Texto antigo",
  );
  await migrateClinical(true);
  const encrypted = await Laudo.collection.findOne({ _id: result.insertedId });
  assert.ok(encrypted.descricao.startsWith("enc:v1:"));
  assert.equal(
    (await Laudo.findById(result.insertedId)).descricao,
    "Texto antigo",
  );
  assert.equal((await migrateClinical(true)).laudos, 0);
  assert.equal(
    (await Laudo.collection.findOne({ _id: result.insertedId })).descricao,
    encrypted.descricao,
  );
});
test("erro de persistência restaura texto para permitir nova tentativa", async () => {
  const existing = await Agendamento.findOne({ status: "agendado" });
  const a = new Agendamento({
    paciente: existing.paciente,
    medico: existing.medico,
    data: existing.data,
    hora: existing.hora,
    observacoes: "Privado",
  });
  await assert.rejects(a.save(), (error) => error.code === 11000);
  assert.equal(a.observacoes, "Privado");
  a.status = "cancelado";
  await a.save();
  assert.equal((await Agendamento.findById(a.id)).observacoes, "Privado");
});

test("catálogo SUS cria sem preço e não retorna valores históricos", async () => {
  const Servico = require("../backend/models/Servico");
  const created = await api(
    "/servicos",
    "POST",
    {
      nome: "Coleta SUS",
      especialidade: specialty,
      orientacoes: "Consulte a unidade",
      valor: 200,
    },
    admin,
  );
  assert.equal(created.status, 201);
  assert.equal(created.body.valor, undefined);
  await Servico.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(created.body._id) },
    { $set: { valor: 200 } },
  );
  const listed = await api("/servicos");
  assert.equal(
    listed.body.find((s) => s._id === created.body._id).valor,
    undefined,
  );
  const edited = await api(
    `/servicos/${created.body._id}`,
    "PUT",
    { nome: "Coleta SUS atualizada", valor: 300 },
    admin,
  );
  assert.equal(edited.status, 200);
  assert.equal(edited.body.valor, undefined);
  const incompatible = await Especialidade.create({
    nome: "Outra especialidade SUS",
  });
  const service = await Servico.create({
    nome: "Serviço especializado",
    especialidade: incompatible._id,
  });
  const booking = await api(
    "/agendamentos",
    "POST",
    {
      paciente: patientId,
      medico: doctorId,
      servico: service.id,
      data: "2026-10-20",
      hora: "09:00",
    },
    admin,
  );
  assert.equal(booking.status, 400);
  assert.match(booking.body.error, /Especialidade não pertence/);
});

test("avaliação pertence ao paciente, exige conclusão e não pode ser duplicada", async () => {
  const created = await api(
    "/auth/register",
    "POST",
    profile("paciente", "rating", "99988877766"),
    admin,
  );
  assert.equal(created.status, 201);
  const token = await initialize("rating@example.test", "99988877766");
  const ownId = created.body.usuario.perfil.id;
  const record = await Agendamento.create({
    paciente: ownId,
    medico: doctorId,
    data: "2020-01-06",
    hora: "09:00",
    status: "realizado",
    examesRealizados: 3,
  });
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { nota: 5 },
        admin,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { nota: 6 },
        token,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { nota: 5 },
        token,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { nota: 1 },
        token,
      )
    ).status,
    409,
  );
  const medicalReview = await api(
    `/agendamentos/${record.id}/avaliacao`,
    "POST",
    {
      tipo: "medico",
      nota: 2,
      comentario: "Foi uma p0rr@. Demorou muito. <script>alert(1)</script>",
    },
    token,
  );
  assert.equal(medicalReview.status, 201, JSON.stringify(medicalReview.body));
  const visible = await api(
    `/agendamentos/${record.id}`,
    "GET",
    undefined,
    token,
  );
  assert.equal(visible.body.notaMedico, 2);
  assert.match(visible.body.comentarioMedico, /\*{5}/);
  assert.doesNotMatch(visible.body.comentarioMedico, /p0rr@/);
  const rawReview = await Agendamento.collection.findOne({ _id: record._id });
  assert.match(rawReview.comentarioMedico, /^enc:v1:/);
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { tipo: "medico", nota: 5 },
        token,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { tipo: "invalido", nota: 5 },
        token,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        `/agendamentos/${record.id}/avaliacao`,
        "POST",
        { tipo: "consulta", nota: 5, comentario: "a".repeat(1001) },
        token,
      )
    ).status,
    400,
  );
  const foreign = await Agendamento.create({
    paciente: patientId,
    medico: doctorId,
    data: "2020-01-06",
    hora: "10:00",
    status: "realizado",
  });
  assert.equal(
    (
      await api(
        `/agendamentos/${foreign.id}/avaliacao`,
        "POST",
        { nota: 5 },
        token,
      )
    ).status,
    404,
  );
  const pending = await Agendamento.create({
    paciente: ownId,
    medico: doctorId,
    data: "2020-01-06",
    hora: "11:00",
    status: "confirmado",
  });
  assert.equal(
    (
      await api(
        `/agendamentos/${pending.id}/avaliacao`,
        "POST",
        { nota: 5 },
        token,
      )
    ).status,
    404,
  );
  const publicStats = await api("/estatisticas");
  assert.equal(publicStats.status, 200);
  assert.ok(publicStats.body.exames >= 3);
  assert.ok(publicStats.body.avaliacoes >= 1);
  assert.equal(
    (await api(`/agendamentos/${record.id}`, "GET", undefined, token)).body
      .satisfacao,
    undefined,
  );
});

test("busca por CPF é administrativa e retorna só dados cadastrais", async () => {
  const body = { cpf: "222.333.444-55" };
  assert.equal(
    (await api("/pacientes/consultar-cpf", "POST", body)).status,
    401,
  );
  assert.equal(
    (await api("/pacientes/consultar-cpf", "POST", body, other)).status,
    403,
  );
  const beforeCount = await Paciente.countDocuments();
  const response = await api("/pacientes/consultar-cpf", "POST", body, admin);
  assert.equal(response.status, 200);
  assert.equal(response.body.encontrado, true);
  assert.equal(response.body.paciente._id, patientId);
  assert.equal(response.body.paciente.cpf, "22233344455");
  for (const field of ["senha", "historicoMedico", "contatos"])
    assert.equal(response.body.paciente[field], undefined);
  assert.equal(
    (await api("/pacientes/consultar-cpf", "POST", { cpf: "111" }, admin))
      .status,
    400,
  );
  assert.equal(
    (
      await api(
        "/pacientes/consultar-cpf",
        "POST",
        { cpf: { $ne: null } },
        admin,
      )
    ).status,
    400,
  );
  assert.deepEqual(
    (
      await api(
        "/pacientes/consultar-cpf",
        "POST",
        { cpf: "00000000001" },
        admin,
      )
    ).body,
    { encontrado: false },
  );
  assert.equal(await Paciente.countDocuments(), beforeCount);
});

test("novas contas clínicas usam CPF e só liberam acesso após trocar senha", async () => {
  for (const [role, cpf] of [
    ["paciente", "12312312312"],
    ["medico", "32132132132"],
  ]) {
    const payload = profile(role, `initial-${role}`, cpf);
    payload.crm = "77777/SC";
    delete payload.senha;
    const created = await api("/auth/register", "POST", payload, admin);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.usuario.trocarSenha, true);
    const stored = await Usuario.findOne({ email: payload.email }).select(
      "+senha",
    );
    assert.notEqual(stored.senha, cpf);
    assert.equal(await bcrypt.compare(cpf, stored.senha), true);
    const initial = await api("/auth/login", "POST", {
      identificador: cpf,
      senha: cpf,
    });
    assert.equal(initial.status, 200, JSON.stringify(initial.body));
    const token = initial.body.token;
    const denied = await api("/agendamentos", "GET", null, token);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.code, "PASSWORD_CHANGE_REQUIRED");
    assert.equal(
      (await api("/auth/me", "GET", null, token)).body.usuario.trocarSenha,
      true,
    );
    assert.equal(
      (await api("/auth/senha", "PATCH", { atual: cpf, nova: cpf }, token))
        .status,
      400,
    );
    assert.equal(
      (
        await api(
          "/auth/senha",
          "PATCH",
          { atual: "errada", nova: password },
          token,
        )
      ).status,
      400,
    );
    assert.equal(
      (await api("/auth/senha", "PATCH", { atual: cpf, nova: password }, token))
        .status,
      200,
    );
    assert.equal((await api("/auth/me", "GET", null, token)).status, 401);
    const nextToken = await login(payload.email);
    assert.equal(
      (await api("/auth/me", "GET", null, nextToken)).body.usuario.trocarSenha,
      false,
    );
    assert.equal(
      (await api("/agendamentos", "GET", null, nextToken)).status,
      200,
    );
    assert.equal(
      (
        await api(
          "/auth/senha",
          "PATCH",
          { atual: password, nova: cpf },
          nextToken,
        )
      ).status,
      400,
    );
  }
});

test("login permite CPF com ou sem pontuação e mantém autenticação por e-mail", async () => {
  for (const [cpf, email, expected] of [
    ["111.222.333-44", "doctor@example.test", "medico"],
    ["33344455566", "other@example.test", "paciente"],
  ]) {
    const byCpf = await api("/auth/login", "POST", {
      identificador: cpf,
      senha: password,
    });
    assert.equal(byCpf.status, 200, JSON.stringify(byCpf.body));
    assert.equal(byCpf.body.usuario.role, expected);
    const byEmail = await api("/auth/login", "POST", {
      identificador: email.toUpperCase(),
      senha: password,
    });
    assert.equal(byEmail.status, 200);
    assert.equal(byEmail.body.usuario.id, byCpf.body.usuario.id);
  }
  assert.equal(
    (await api("/auth/login", "POST", { cpf: "33344455566", senha: "errada" }))
      .status,
    401,
  );
  assert.equal(
    (
      await api("/auth/login", "POST", {
        identificador: { $ne: null },
        senha: password,
      })
    ).status,
    400,
  );
});

test("CPF de duas contas não escolhe um perfil silenciosamente", async () => {
  const duplicate = await Medico.create({
    nome: "Outro perfil",
    email: "dual@example.test",
    cpf: "33344455566",
    crm: "88888/SC",
    telefone: "48999999999",
    dataNascimento: "1990-01-01",
    genero: "Outro",
  });
  await Usuario.create({
    nome: "Outro perfil",
    email: "dual@example.test",
    senha: password,
    role: "medico",
    perfil: { model: "Medico", id: duplicate._id },
  });
  const result = await api("/auth/login", "POST", {
    identificador: "33344455566",
    senha: password,
  });
  assert.equal(result.status, 400);
  assert.match(result.body.error, /mais de uma conta/);
  assert.equal(
    (
      await api("/auth/login", "POST", {
        identificador: "dual@example.test",
        senha: password,
      })
    ).status,
    200,
  );
});

test("horários: autorização, validação, padrão persistido, aplicação coletiva e conflitos", async () => {
  const schedule = {
    diasSemana: [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado",
    ],
    horaInicio: "07:15",
    horaFim: "20:45",
  };
  const body = { horarioDisponivel: schedule };
  assert.equal(
    (await api("/medicos/horario-padrao", "GET", null, other)).status,
    403,
  );
  assert.equal(
    (await api(`/medicos/${doctorId}/horario`, "PUT", body, doctor)).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/medicos/horario-padrao",
        "PUT",
        { horarioDisponivel: { ...schedule, horaFim: "06:00" } },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (await api("/medicos/horario-padrao", "PUT", body, admin)).status,
    200,
  );
  assert.equal(
    (await api("/medicos/horario-padrao", "GET", null, admin)).body.horaInicio,
    "07:15",
  );
  // Salvar padrão sozinho não substitui o expediente de médicos existentes.
  assert.equal(
    (await Medico.findById(doctorId)).horarioDisponivel.horaInicio,
    "08:00",
  );
  const newProfile = profile("medico", "schedule", "43243243243");
  newProfile.crm = "87654/SC";
  const registered = await api("/auth/register", "POST", newProfile, admin);
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  assert.equal(
    (await Medico.findById(registered.body.usuario.perfil.id)).horarioDisponivel
      .horaInicio,
    "07:15",
  );
  assert.equal(
    (
      await api(
        "/medicos/horario-padrao",
        "PUT",
        { ...body, aplicarTodos: true },
        admin,
      )
    ).status,
    200,
  );
  assert.equal(
    (await Medico.findById(doctorId)).horarioDisponivel.horaInicio,
    "07:15",
  );
  const day = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const booking = await api(
    "/agendamentos",
    "POST",
    { paciente: otherId, medico: doctorId, data: day, hora: "07:15" },
    admin,
  );
  assert.equal(booking.status, 201, JSON.stringify(booking.body));
  assert.equal(booking.body.paciente._id, otherId);
  const availability = await api(
    `/agendamentos/disponibilidade?medico=${doctorId}&data=${day}`,
    "GET",
    null,
    admin,
  );
  assert.ok(availability.body.horarios.includes("07:45"));
  assert.ok(!availability.body.horarios.includes("07:15"));
  const narrower = { horarioDisponivel: { ...schedule, horaInicio: "08:00" } };
  assert.equal(
    (await api(`/medicos/${doctorId}/horario`, "PUT", narrower, admin)).status,
    409,
  );
  assert.equal(
    (
      await api(
        "/medicos/horario-padrao",
        "PUT",
        { ...narrower, aplicarTodos: true },
        admin,
      )
    ).status,
    409,
  );
  assert.equal(
    (await api("/medicos/horario-padrao", "GET", null, admin)).body.horaInicio,
    "07:15",
  );
  await api(`/agendamentos/${booking.body._id}`, "DELETE", null, admin);
  assert.equal(
    (await api(`/medicos/${doctorId}/horario`, "PUT", narrower, admin)).status,
    200,
  );
});

test("admin libera e bloqueia horários por data, protege reservas e valida disputa concorrente", async () => {
  const day = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const path = `/medicos/${doctorId}/disponibilidade`;
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: [] }, other)).status,
    403,
  );
  assert.equal(
    (await api(`${path}?data=${day}`, "GET", null, doctor)).status,
    403,
  );
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: ["09:00", "09:15"] }, admin))
      .status,
    400,
  );
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: ["22:00", "22:30"] }, admin))
      .status,
    200,
  );
  let available = await api(
    `/agendamentos/disponibilidade?medico=${doctorId}&data=${day}`,
    "GET",
    null,
    other,
  );
  assert.deepEqual(available.body.horarios, ["22:00", "22:30"]);
  const booking = await api(
    "/agendamentos",
    "POST",
    { medico: doctorId, paciente: otherId, data: day, hora: "22:00" },
    admin,
  );
  assert.equal(booking.status, 201, JSON.stringify(booking.body));
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: ["22:00"] }, admin)).status,
    200,
  );
  available = await api(
    `/agendamentos/disponibilidade?medico=${doctorId}&data=${day}`,
    "GET",
    null,
    other,
  );
  assert.deepEqual(available.body.horarios, []);
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: [] }, admin)).status,
    409,
  );
  assert.equal(
    (await api(path, "PUT", { data: day, usarPadrao: true }, admin)).status,
    409,
  );
  assert.equal(
    (await api(`${path}?data=${day}`, "GET", null, admin)).body.reservados[0],
    "22:00",
  );
  await api(`/agendamentos/${booking.body._id}`, "DELETE", null, admin);
  assert.equal(
    (await api(path, "PUT", { data: day, usarPadrao: true }, admin)).status,
    200,
  );
  assert.equal(
    (await api(`${path}?data=${day}`, "GET", null, admin)).body.personalizado,
    false,
  );
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: [] }, admin)).status,
    200,
  );
  assert.equal(
    (
      await api(
        "/agendamentos",
        "POST",
        { medico: doctorId, paciente: otherId, data: day, hora: "09:00" },
        admin,
      )
    ).status,
    409,
  );
  assert.equal(
    (await api(path, "PUT", { data: day, horarios: ["22:00"] }, admin)).status,
    200,
  );
  const [reserved, changed] = await Promise.all([
    api(
      "/agendamentos",
      "POST",
      { medico: doctorId, paciente: otherId, data: day, hora: "22:00" },
      admin,
    ),
    api(path, "PUT", { data: day, horarios: [] }, admin),
  ]);
  assert.ok(
    (reserved.status === 201 && changed.status === 409) ||
      (reserved.status === 409 && changed.status === 200),
    JSON.stringify([reserved, changed]),
  );
});
