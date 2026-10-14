require("../config/env");
const connectDB = require("../config/database");
const {
  chave,
  isEncrypted,
  descriptografar,
  criptografar,
} = require("../utils/criptografia");
const targets = [
  [
    require("../models/Laudo"),
    ["titulo", "descricao", "resultados", "conclusao", "recomendacoes"],
  ],
  [require("../models/Agendamento"), ["notas", "observacoes"]],
  [
    require("../models/Paciente"),
    [
      "historicoMedico.alergias",
      "historicoMedico.doencas",
      "historicoMedico.medicamentos",
      "historicoMedico.cirurgias",
    ],
  ],
];
const get = (doc, path) =>
  path.split(".").reduce((value, part) => value?.[part], doc);
function plan(doc, fields) {
  const changes = {},
    guard = { _id: doc._id };
  for (const path of fields) {
    const original = get(doc, path);
    if (original === undefined || original === null) continue;
    const values = Array.isArray(original) ? original : [original];
    let changed = false;
    const encrypted = values.map((value) => {
      if (typeof value !== "string")
        throw new Error("Tipo clínico inválido; corrija antes de migrar.");
      if (isEncrypted(value)) {
        descriptografar(value);
        return value;
      }
      if (!value) return value;
      changed = true;
      return criptografar(value);
    });
    if (changed) {
      changes[path] = Array.isArray(original) ? encrypted : encrypted[0];
      guard[path] = original;
    }
  }
  return { changes, guard };
}
async function migrateClinical(apply = false) {
  chave();
  // Primeira passagem verifica todos os tipos/chaves antes de qualquer gravação.
  const summary = {};
  for (const [Model, fields] of targets) {
    let pending = 0;
    const projection = Object.fromEntries(fields.map((path) => [path, 1]));
    for await (const doc of Model.collection.find({}, { projection }))
      if (Object.keys(plan(doc, fields).changes).length) pending++;
    summary[Model.collection.name] = pending;
  }
  console.log(
    JSON.stringify({ mode: apply ? "aplicar" : "conferir", pending: summary }),
  );
  if (!apply) return summary;
  // Atualização atômica por documento, com comparação do texto original: não sobrescreve edição concorrente.
  for (const [Model, fields] of targets) {
    const projection = Object.fromEntries(fields.map((path) => [path, 1]));
    for await (const doc of Model.collection.find({}, { projection })) {
      const { changes, guard } = plan(doc, fields);
      if (!Object.keys(changes).length) continue;
      const result = await Model.collection.updateOne(guard, { $set: changes });
      if (!result.matchedCount)
        throw new Error(
          "Registro alterado durante a migração; execute novamente. Registros já protegidos são preservados.",
        );
    }
  }
  return summary;
}
async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("Migração exige MONGODB_URI persistente.");
  try {
    await connectDB();
    await migrateClinical(process.argv.includes("--apply"));
  } finally {
    await connectDB.disconnectDB();
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { migrateClinical, plan };
