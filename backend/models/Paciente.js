const mongoose = require("mongoose");

const pacienteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    cpf: {
      type: String,
      set: (value) => String(value).replace(/\D/g, ""),
      match: [/^\d{11}$/, "CPF deve conter 11 dígitos"],
      required: [true, "CPF é obrigatório"],
      unique: true,
      sparse: true,
    },
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
      required: [true, "Data de nascimento é obrigatória"],
    },
    genero: {
      type: String,
      enum: ["M", "F", "Outro"],
      required: true,
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
    contatos: [
      {
        tipo: String, // emergência, recado
        nome: String,
        telefone: String,
      },
    ],
    historicoMedico: {
      alergias: [String],
      doencas: [String],
      medicamentos: [String],
      cirurgias: [String],
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

pacienteSchema.index({ nome: 1, _id: 1 });
module.exports = mongoose.model("Paciente", pacienteSchema);
