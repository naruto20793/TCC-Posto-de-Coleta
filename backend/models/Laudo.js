const mongoose = require("mongoose");

const laudoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: [true, "Paciente é obrigatório"],
    },
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medico",
      required: [true, "Médico é obrigatório"],
    },
    agendamento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agendamento",
    },
    titulo: {
      type: String,
      maxlength: 200,
      required: [true, "Título do laudo é obrigatório"],
    },
    descricao: {
      type: String,
      required: [true, "Descrição do laudo é obrigatória"],
    },
    resultados: {
      type: String,
      maxlength: 10000,
    },
    conclusao: {
      type: String,
      maxlength: 10000,
    },
    recomendacoes: {
      type: String,
      maxlength: 10000,
    },
    anexos: [
      {
        nome: String,
        url: String,
        tipo: String,
      },
    ],
    status: {
      type: String,
      enum: ["rascunho", "finalizado", "assinado"],
      default: "rascunho",
    },
    dataCriacao: {
      type: Date,
      default: Date.now,
    },
    dataAtualizacao: {
      type: Date,
      default: Date.now,
    },
    dataAssinatura: Date,
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

laudoSchema.index({ paciente: 1, createdAt: -1 });
laudoSchema.index({ medico: 1, createdAt: -1 });
module.exports = mongoose.model("Laudo", laudoSchema);
