const mongoose = require("mongoose");

const medicoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    crm: {
      type: String,
      required: [true, "CRM é obrigatório"],
      unique: true,
    },
    cpf: {
      type: String,
      set: (value) => String(value).replace(/\D/g, ""),
      match: [/^\d{11}$/, "CPF deve conter 11 dígitos"],
      required: [true, "CPF é obrigatório"],
      unique: true,
      sparse: true,
    },
    especialidades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Especialidade",
      },
    ],
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      lowercase: true,
      trim: true,
      match: [
        /^(?:[^\s@]+)@(?:[^\s@]+\.)+[^\s@]{2,63}$/i,
        "Por favor, forneça um email válido",
      ],
    },
    telefone: {
      type: String,
      required: [true, "Telefone é obrigatório"],
    },
    dataNascimento: {
      type: Date,
      validate: (value) => value <= new Date(),
      required: true,
    },
    genero: {
      type: String,
      enum: ["M", "F", "Outro"],
    },
    endereco: {
      rua: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
      cep: String,
    },
    horarioDisponivel: {
      diasSemana: {
        type: [String],
        default: ["segunda", "terça", "quarta", "quinta", "sexta"],
      }, // segunda, terça, etc
      horaInicio: { type: String, default: "08:00" },
      horaFim: { type: String, default: "17:00" },
    },
    senha: {
      type: String,
      select: false,
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
  },
);

medicoSchema.index({ nome: 1, _id: 1 });
module.exports = mongoose.model("Medico", medicoSchema);
