process.env.CRYPTO_KEY = "extra-integration-only-key-not-for-production";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Usuario = require("../backend/models/Usuario");
const Paciente = require("../backend/models/Paciente");
const Medico = require("../backend/models/Medico");
const Laudo = require("../backend/models/Laudo");
const Movimento = require("../backend/models/MovimentacaoLaudo");
const Auditoria = require("../backend/models/Auditoria");
const { indexes } = require("../backend/scripts/database-maintenance");
const app = require("../backend/app");
let mongo, server, base, patientId, doctorId, admin, doctor, patient, other;
const password = "Workflow-test-only-2026";
async function api(path, method = "GET", body, token) {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
async function account(role, suffix, cpf) {
  let perfil;
  if (["medico", "paciente"].includes(role)) {
    const Model = role === "medico" ? Medico : Paciente;
    const record = await Model.create({
      nome: suffix,
      cpf,
      email: `${suffix}@example.test`,
      telefone: "48999999999",
      dataNascimento: "1990-01-01",
      genero: "Outro",
      ...(role === "medico" ? { crm: "999/SC" } : {}),
    });
    perfil = { model: Model.modelName, id: record._id };
  }
  const record = await Usuario.create({
    nome: suffix,
    email: `${suffix}@example.test`,
    senha: password,
    role,
    perfil,
  });
  const login = await api("/auth/login", "POST", {
    email: record.email,
    senha: password,
  });
  assert.equal(login.status, 200);
  return { token: login.body.token, record };
}
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri(), { autoIndex: false });
  await indexes();
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  admin = await account("super_admin", "admin");
  doctor = await account("medico", "medico", "11122233344");
  doctorId = doctor.record.perfil.id;
  patient = await account("paciente", "paciente", "22233344455");
  patientId = patient.record.perfil.id;
  other = await account("paciente", "outro", "33344455566");
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("distribuição exige sequência, identidade de recebedor, permissão e histórico protegido", async () => {
  const report = await Laudo.create({
    paciente: patientId,
    medico: doctorId,
    titulo: "Documento",
    descricao: "Resultado",
    status: "finalizado",
  });
  const path = `/laudos/${report.id}/distribuicao`;
  assert.equal((await api(path)).status, 401);
  assert.equal((await api(path, "GET", null, patient.token)).status, 403);
  assert.equal(
    (await api(path, "POST", { situacao: "recebido" }, doctor.token)).status,
    403,
  );
  assert.equal(
    (await api(path, "POST", { situacao: "entregue" }, admin.token)).status,
    409,
  );
  const attempts = await Promise.all(
    [1, 2].map(() => api(path, "POST", { situacao: "recebido" }, admin.token)),
  );
  assert.deepEqual(attempts.map((x) => x.status).sort(), [201, 409]);
  assert.equal(
    (await api(path, "POST", { situacao: "disponivel" }, admin.token)).status,
    201,
  );
  assert.equal(
    (
      await api(
        path,
        "POST",
        { situacao: "entregue", recebedor: "" },
        admin.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        path,
        "POST",
        {
          situacao: "entregue",
          recebedor: "Pessoa autorizada",
          vinculoRecebedor: "responsavel",
        },
        admin.token,
      )
    ).status,
    201,
  );
  assert.equal(
    (await api(path, "POST", { situacao: "recebido" }, admin.token)).status,
    409,
  );
  const history = await api(path, "GET", null, admin.token);
  assert.equal(history.body.movimentos.length, 3);
  assert.equal(history.body.movimentos[0].recebedor, "Pessoa autorizada");
  const raw = await Movimento.collection.findOne({
    laudo: report._id,
    situacao: "entregue",
  });
  assert.notEqual(raw.recebedor, "Pessoa autorizada");
  const visible = await api(`/laudos/${report.id}`, "GET", null, patient.token);
  assert.equal(visible.body.distribuicao.situacao, "entregue");
  assert.ok(!JSON.stringify(visible.body).includes("Pessoa autorizada"));
  assert.equal(
    (await api(`/laudos/${report.id}`, "GET", null, other.token)).status,
    404,
  );
  const audit = await Auditoria.find({
    recurso: `distribuicao-laudo:${report.id}`,
  });
  assert.equal(audit.length, 3);
  assert.ok(!JSON.stringify(audit).includes("Pessoa autorizada"));
});

test("retificação preserva original, mantém rascunho privado e publica vínculo uma única vez", async () => {
  const original = await Laudo.create({
    paciente: patientId,
    medico: doctorId,
    titulo: "Original",
    descricao: "Conteúdo original",
    status: "finalizado",
  });
  const path = `/laudos/${original.id}/retificacoes`;
  assert.equal(
    (await api(path, "POST", { motivo: "Correção" }, admin.token)).status,
    403,
  );
  assert.equal(
    (await api(path, "POST", { motivo: " " }, doctor.token)).status,
    400,
  );
  const attempts = await Promise.all(
    [1, 2].map(() =>
      api(path, "POST", { motivo: "Correção justificada" }, doctor.token),
    ),
  );
  assert.deepEqual(attempts.map((x) => x.status).sort(), [201, 409]);
  const draft = attempts.find((x) => x.status === 201).body;
  assert.equal(draft.versao, 2);
  assert.equal(draft.retifica, original.id);
  assert.equal(
    (await api(`/laudos/${draft._id}`, "GET", null, patient.token)).status,
    404,
  );
  assert.equal((await Laudo.findById(original.id)).substituidoPor, undefined);
  assert.equal(
    (
      await api(
        `/laudos/${draft._id}`,
        "PUT",
        { descricao: "Correção publicada", status: "finalizado" },
        doctor.token,
      )
    ).status,
    200,
  );
  const old = await api(`/laudos/${original.id}`, "GET", null, patient.token);
  assert.equal(old.body.descricao, "Conteúdo original");
  assert.equal(old.body.substituidoPor, draft._id);
  assert.equal(
    (await api(`/laudos/${draft._id}`, "GET", null, patient.token)).body
      .descricao,
    "Correção publicada",
  );
  assert.equal(
    (
      await api(
        `/laudos/${draft._id}`,
        "PUT",
        { descricao: "Reescrita indevida" },
        doctor.token,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        `/laudos/${original.id}/distribuicao`,
        "POST",
        { situacao: "recebido" },
        admin.token,
      )
    ).status,
    409,
  );
  assert.notEqual(
    (
      await Laudo.collection.findOne({
        _id: new mongoose.Types.ObjectId(draft._id),
      })
    ).motivoRetificacao,
    "Correção justificada",
  );
});

test("redefinição administrativa revoga sessão, não retorna hash, expira e exige troca", async () => {
  const target = await account("paciente", "recuperar", "44455566677");
  const path = `/auth/usuarios/${target.record.id}/senha-temporaria`;
  assert.equal(
    (await api(path, "POST", { confirmacaoSenha: password }, patient.token))
      .status,
    403,
  );
  assert.equal(
    (await api(path, "POST", { confirmacaoSenha: "errada" }, admin.token))
      .status,
    403,
  );
  const reset = await api(
    path,
    "POST",
    { confirmacaoSenha: password },
    admin.token,
  );
  assert.equal(reset.status, 200);
  assert.equal((await api("/auth/me", "GET", null, target.token)).status, 401);
  assert.ok(
    !JSON.stringify(
      await Usuario.findById(target.record.id).select("+senha"),
    ).includes(reset.body.senhaTemporaria),
  );
  const login = await api("/auth/login", "POST", {
    email: target.record.email,
    senha: reset.body.senhaTemporaria,
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.usuario.trocarSenha, true);
  assert.equal(
    (await api("/laudos", "GET", null, login.body.token)).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/auth/senha",
        "PATCH",
        { atual: reset.body.senhaTemporaria, nova: "Nova-senha-2026" },
        login.body.token,
      )
    ).status,
    200,
  );
  const newLogin = await api("/auth/login", "POST", {
    email: target.record.email,
    senha: "Nova-senha-2026",
  });
  assert.equal(newLogin.status, 200);
  assert.equal(newLogin.body.usuario.trocarSenha, false);
  const reset2 = await api(
    path,
    "POST",
    { confirmacaoSenha: password },
    admin.token,
  );
  await Usuario.updateOne(
    { _id: target.record.id },
    { $set: { senhaTemporariaAte: new Date(0) } },
  );
  assert.equal(
    (
      await api("/auth/login", "POST", {
        email: target.record.email,
        senha: reset2.body.senhaTemporaria,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await api(
        `/auth/usuarios/${admin.record.id}/senha-temporaria`,
        "POST",
        { confirmacaoSenha: password },
        admin.token,
      )
    ).status,
    400,
  );
});
