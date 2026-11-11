const mongoose = require("mongoose");
const { types, statuses } = require("../services/system-feedback");
const schema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    tipo: { type: String, enum: types, required: true },
    nota: { type: Number, min: 1, max: 5, validate: Number.isInteger },
    comentario: { type: String, maxlength: 1000, default: "" },
    status: { type: String, enum: statuses, default: "novo", required: true },
  },
  { timestamps: true, optimisticConcurrency: true },
);
schema.pre("validate", function () {
  if (this.tipo === "avaliacao" && this.nota === undefined)
    this.invalidate("nota", "Selecione uma nota.");
  if (this.tipo !== "avaliacao" && !this.comentario?.trim())
    this.invalidate(
      "comentario",
      "Escreva um comentário para este tipo de envio.",
    );
});
schema.index({ usuario: 1, createdAt: -1, _id: -1 });
schema.index({ createdAt: -1, _id: -1 });
schema.plugin(require("./clinical-encryption"), { fields: ["comentario"] });
module.exports = mongoose.model("FeedbackSistema", schema);
