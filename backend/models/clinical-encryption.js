const { criptografar, descriptografar } = require("../utils/criptografia");
// Validação acontece em texto claro; somente o valor persistido é criptografado.
// As rotas devem usar documentos + save(), nunca lean()/bulkWrite() para estes campos.
module.exports = function clinicalEncryption(schema, { fields }) {
  const mapValue = (value, fn) =>
    Array.isArray(value) ? value.map(fn) : fn(value);
  function restore(doc, retry = false) {
    const values = doc.$locals.clinicalPlaintext;
    if (!values) return;
    for (const [path, value] of Object.entries(values)) {
      doc.set(path, value);
      if (retry) doc.markModified(path);
      else doc.unmarkModified(path);
    }
    delete doc.$locals.clinicalPlaintext;
  }
  schema.post("init", function (doc) {
    for (const path of fields) {
      const value = doc.get(path);
      if (value === undefined || value === null) continue;
      doc.set(path, mapValue(value, descriptografar));
      doc.unmarkModified(path);
    }
  });
  schema.pre("save", function () {
    const values = {};
    // Criptografa todos antes de alterar o documento: falha de chave não o corrompe.
    const encrypted = {};
    for (const path of fields) {
      if (!this.isModified(path)) continue;
      const value = this.get(path);
      values[path] = Array.isArray(value) ? [...value] : value;
      encrypted[path] = mapValue(value, criptografar);
    }
    this.$locals.clinicalPlaintext = values;
    for (const [path, value] of Object.entries(encrypted))
      this.set(path, value);
  });
  schema.post("save", function (doc) {
    restore(doc);
  });
  schema.post("save", function (error, doc, next) {
    restore(doc, true);
    next(error);
  });
  for (const operation of [
    "updateOne",
    "updateMany",
    "findOneAndUpdate",
    "replaceOne",
    "findOneAndReplace",
  ]) {
    schema.pre(operation, function () {
      const update = this.getUpdate();
      const touches = (key) =>
        fields.some(
          (path) =>
            key === path ||
            key.startsWith(path + ".") ||
            path.startsWith(key + "."),
        );
      if (
        Array.isArray(update) ||
        operation.includes("Replace") ||
        operation === "replaceOne" ||
        Object.entries(update || {}).some(([op, data]) =>
          op.startsWith("$")
            ? Object.keys(data || {}).some(touches) ||
              (op === "$rename" && Object.values(data || {}).some(touches))
            : touches(op),
        )
      )
        throw new Error(
          "Campos clínicos exigem documento.save() para validar e criptografar.",
        );
    });
  }
  schema.pre("insertMany", function (next) {
    next(
      new Error(
        "Dados clínicos exigem create()/save(); insertMany não executa criptografia.",
      ),
    );
  });
};
