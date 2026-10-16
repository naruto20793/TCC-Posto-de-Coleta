const mongoose = require("mongoose");
const { slots } = require("../services/schedule");

const agendamentoSchema = new mongoose.Schema(
  {
    examesRealizados: {
      type: Number,
      min: 0,
      max: 1000,
      validate: Number.isInteger,
    },
    avaliacaoRegistrada: { type: Boolean, default: false },
    comentarioConsulta: { type: String, maxlength: 1000 },
    comentarioMedico: { type: String, maxlength: 1000 },
    avaliacaoMedicoRegistrada: { type: Boolean, default: false },
    notaMedico: { type: Number, min: 1, max: 5, validate: Number.isInteger },
    satisfacao: {
      type: Number,
      min: 1,
      max: 5,
      validate: Number.isInteger,
      select: false,
    },
    reservaAtiva: { type: Boolean, default: false },
    slots: { type: [String], select: false },
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
    servico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servico",
    },
    especialidade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Especialidade",
    },
    data: {
      type: Date,
      required: [true, "Data é obrigatória"],
    },
    hora: {
      type: String,
      required: [true, "Hora é obrigatória"],
    },
    duracao: {
      type: Number, // em minutos
      default: 30,
    },
    status: {
      type: String,
      enum: ["agendado", "confirmado", "realizado", "cancelado", "falta"],
      default: "agendado",
    },
    notas: {
      type: String,
    },
    observacoes: {
      type: String,
    },
    lembretes: [
      {
        tipo: String, // email, sms, whatsapp
        enviado: {
          type: Boolean,
          default: false,
        },
        dataEnvio: Date,
      },
    ],
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
    optimisticConcurrency: true,
  },
);

agendamentoSchema.pre("validate", function () {
  this.reservaAtiva = ["agendado", "confirmado"].includes(this.status);
  this.slots = slots(this.data, this.hora, this.duracao);
});
// Cada minuto reservado participa do índice único: bloqueia sobreposição concorrente.
agendamentoSchema.index(
  { medico: 1, slots: 1 },
  {
    unique: true,
    partialFilterExpression: { reservaAtiva: true },
    name: "medico_horario_unico",
  },
);
agendamentoSchema.index(
  { paciente: 1, slots: 1 },
  {
    unique: true,
    partialFilterExpression: { reservaAtiva: true },
    name: "paciente_horario_unico",
  },
);
// Índices para melhor performance
agendamentoSchema.index({ paciente: 1, data: 1 });
agendamentoSchema.index({ medico: 1, data: 1 });
agendamentoSchema.index({ data: 1, status: 1 });

agendamentoSchema.index({ paciente: 1, data: -1, hora: -1, _id: -1 });
agendamentoSchema.index({ medico: 1, data: -1, hora: -1, _id: -1 });
agendamentoSchema.index({ data: -1, hora: -1, _id: -1 });
agendamentoSchema.plugin(require("./clinical-encryption"), {
  fields: ["notas", "observacoes", "comentarioConsulta", "comentarioMedico"],
});
module.exports = mongoose.model("Agendamento", agendamentoSchema);
