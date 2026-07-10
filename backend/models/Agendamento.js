const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'Paciente é obrigatório']
    },
    medico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medico',
        required: [true, 'Médico é obrigatório']
    },
    servico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Servico'
    },
    especialidade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Especialidade'
    },
    data: {
        type: Date,
        required: [true, 'Data é obrigatória']
    },
    hora: {
        type: String,
        required: [true, 'Hora é obrigatória']
    },
    duracao: {
        type: Number, // em minutos
        default: 30
    },
    status: {
        type: String,
        enum: ['agendado', 'confirmado', 'realizado', 'cancelado', 'falta'],
        default: 'agendado'
    },
    notas: {
        type: String
    },
    observacoes: {
        type: String
    },
    lembretes: [{
        tipo: String, // email, sms, whatsapp
        enviado: {
            type: Boolean,
            default: false
        },
        dataEnvio: Date
    }],
    dataCriacao: {
        type: Date,
        default: Date.now
    },
    dataAtualizacao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para melhor performance
agendamentoSchema.index({ paciente: 1, data: 1 });
agendamentoSchema.index({ medico: 1, data: 1 });
agendamentoSchema.index({ data: 1, status: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);
