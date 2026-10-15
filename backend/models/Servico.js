const mongoose = require("mongoose");

const servicoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome do serviço é obrigatório"],
      trim: true,
    },
    descricao: {
      type: String,
    },
    especialidade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Especialidade",
    },
    orientacoes: { type: String, trim: true, maxlength: 2000 },
    duracao: {
      type: Number,
      min: 15,
      max: 240, // em minutos
      default: 30,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    dataCriacao: {
      type: Date,
      default: Date.now,
    },
    dataAtualizacao: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, result) => {
        delete result.valor;
        return result;
      },
    },
  },
);

module.exports = mongoose.model("Servico", servicoSchema);
