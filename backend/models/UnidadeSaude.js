const mongoose = require("mongoose");
const tipos = [
  "posto_coleta",
  "ubs",
  "laboratorio",
  "policlinica",
  "centro_especialidades",
  "upa",
  "hospital",
  "outro",
];
const niveis = ["primario", "secundario", "terciario"];
const schema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, maxlength: 120 },
    tipo: { type: String, enum: tipos, required: true },
    nivel: { type: String, enum: niveis, required: true },
    endereco: { type: String, trim: true, maxlength: 500 },
    telefone: { type: String, trim: true, maxlength: 30 },
    servicos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Servico" }],
    ativo: { type: Boolean, default: true },
    versao: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);
schema.index({ nome: 1, _id: 1 });
const Model = mongoose.model("UnidadeSaude", schema);
Model.tipos = tipos;
Model.niveis = niveis;
module.exports = Model;
