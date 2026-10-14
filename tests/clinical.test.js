const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Laudo = require("../backend/models/Laudo");
const Paciente = require("../backend/models/Paciente");
const { plan } = require("../backend/scripts/encrypt-clinical");
process.env.CRYPTO_KEY = "isolated-driver-test-key-not-for-production-2026";
const clone = (value) =>
  mongoose.mongo.BSON.deserialize(mongoose.mongo.BSON.serialize({ value }))
    .value;
// Exercita middleware/validação reais do Mongoose; apenas o transporte é substituído.
async function withDriver(Model, run) {
  const originals = {
    insertOne: Model.collection.insertOne,
    updateOne: Model.collection.updateOne,
  };
  let raw, nextError;
  Model.collection.insertOne = async (doc) => {
    if (nextError) {
      const error = nextError;
      nextError = undefined;
      throw error;
    }
    raw = clone(doc);
    return { acknowledged: true, insertedId: doc._id };
  };
  Model.collection.updateOne = async (filter, update) => {
    for (const [path, value] of Object.entries(update.$set || {})) {
      let object = raw;
      const parts = path.split(".");
      const last = parts.pop();
      for (const part of parts) object = object[part] ??= {};
      object[last] = clone(value);
    }
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  };
  try {
    await run({
      raw: () => raw,
      fail: (error) => {
        nextError = error;
      },
    });
  } finally {
    Object.assign(Model.collection, originals);
  }
}
const report = () =>
  new Laudo({
    paciente: new mongoose.Types.ObjectId(),
    medico: new mongoose.Types.ObjectId(),
    titulo: "Exame",
    descricao: "Segredo clínico",
  });
test("gravação de laudo criptografa, hidratação recupera e edição preserva proteção", async () => {
  await withDriver(Laudo, async ({ raw }) => {
    const doc = report();
    await doc.save();
    assert.equal(doc.descricao, "Segredo clínico");
    assert.ok(raw().descricao.startsWith("enc:v1:"));
    const encrypted = raw().descricao;
    const loaded = Laudo.hydrate(raw());
    assert.equal(loaded.descricao, "Segredo clínico");
    loaded.status = "finalizado";
    await loaded.save();
    assert.equal(raw().descricao, encrypted);
    loaded.descricao = "Outro segredo";
    await loaded.save();
    assert.ok(!JSON.stringify(raw()).includes("segredo"));
    assert.equal(Laudo.hydrate(raw()).descricao, "Outro segredo");
  });
});
test("listas do histórico médico são protegidas e não vazam em edição de nome", async () => {
  await withDriver(Paciente, async ({ raw }) => {
    const doc = new Paciente({
      nome: "Ana",
      email: "ana@example.test",
      cpf: "11122233344",
      telefone: "48999999999",
      dataNascimento: "1990-01-01",
      genero: "Outro",
      historicoMedico: { alergias: ["Penicilina"] },
    });
    await doc.save();
    assert.ok(raw().historicoMedico.alergias[0].startsWith("enc:v1:"));
    const loaded = Paciente.hydrate(raw());
    assert.deepEqual([...loaded.historicoMedico.alergias], ["Penicilina"]);
    loaded.nome = "Ana atualizada";
    await loaded.save();
    assert.ok(!JSON.stringify(raw()).includes("Penicilina"));
    loaded.historicoMedico.alergias.push("Amendoim");
    await loaded.save();
    assert.deepEqual(
      [...Paciente.hydrate(raw()).historicoMedico.alergias],
      ["Penicilina", "Amendoim"],
    );
    assert.ok(!JSON.stringify(raw()).includes("Amendoim"));
  });
});
test("falha de persistência não deixa documento cifrado nem duplica criptografia no retry", async () => {
  await withDriver(Laudo, async ({ raw, fail }) => {
    const doc = report();
    fail(Object.assign(new Error("duplicado"), { code: 11000 }));
    await assert.rejects(doc.save(), (error) => error.code === 11000);
    assert.equal(doc.descricao, "Segredo clínico");
    await doc.save();
    assert.equal(Laudo.hydrate(raw()).descricao, "Segredo clínico");
  });
});
test("escritas clínicas sem middleware são recusadas antes do transporte", async () => {
  const id = new mongoose.Types.ObjectId();
  await assert.rejects(
    Laudo.updateOne({ _id: id }, { $set: { descricao: "sem proteção" } }),
    /save/,
  );
  await assert.rejects(
    Paciente.updateMany({}, { $push: { "historicoMedico.alergias": "x" } }),
    /save/,
  );
  await assert.rejects(Laudo.insertMany([report().toObject()]), /criptografia/);
});
test("plano clínico guarda valor original, verifica chave e ignora campos já protegidos", () => {
  const original = { _id: new mongoose.Types.ObjectId(), descricao: "Legado" };
  const first = plan(original, ["descricao"]);
  assert.equal(first.guard.descricao, "Legado");
  assert.ok(first.changes.descricao.startsWith("enc:v1:"));
  assert.deepEqual(
    plan({ ...original, ...first.changes }, ["descricao"]).changes,
    {},
  );
  assert.throws(() =>
    plan({ ...original, descricao: { invalido: true } }, ["descricao"]),
  );
  assert.throws(() =>
    plan({ ...original, descricao: "enc:v1:inválido" }, ["descricao"]),
  );
});
