const mongoose = require("mongoose");

// Histórico separado: não faz o documento clínico crescer a cada movimentação.
const schema = new mongoose.Schema({
  laudo: { type: mongoose.Schema.Types.ObjectId, ref: "Laudo", required: true },
  sequencia: { type: Number, required: true, min: 1 },
  situacao: {
    type: String,
    enum: ["recebido", "disponivel", "entregue"],
    required: true,
  },
  responsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  data: { type: Date, required: true, default: Date.now },
  recebedor: { type: String, maxlength: 120, default: "" },
  vinculoRecebedor: {
    type: String,
    enum: ["", "paciente", "responsavel"],
    default: "",
  },
});
schema.index({ laudo: 1, sequencia: 1 }, { unique: true });
schema.plugin(require("./clinical-encryption"), { fields: ["recebedor"] });
module.exports = mongoose.model("MovimentacaoLaudo", schema);
