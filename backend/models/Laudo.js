const mongoose = require('mongoose');

const laudoSchema = new mongoose.Schema({
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
    agendamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agendamento'
    },
    titulo: {
        type: String,
        required: [true, 'Título do laudo é obrigatório']
    },
    descricao: {
        type: String,
        required: [true, 'Descrição do laudo é obrigatória']
    },
    resultados: {
        type: String
    },
    conclusao: {
        type: String
    },
    recomendacoes: {
        type: String
    },
    anexos: [{
        nome: String,
        url: String,
        tipo: String
    }],
    status: {
        type: String,
        enum: ['rascunho', 'finalizado', 'assinado'],
        default: 'rascunho'
    },
    dataCriacao: {
        type: Date,
        default: Date.now
    },
    dataAtualizacao: {
        type: Date,
        default: Date.now
    },
    dataAssinatura: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Laudo', laudoSchema);
