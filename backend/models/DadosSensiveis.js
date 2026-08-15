const mongoose = require('mongoose');

const dadosSensiveisSchema = new mongoose.Schema({
    entidade: {
        type: String,
        required: true,
        enum: ['Paciente', 'Medico', 'Funcionario', 'Laudo', 'Agendamento']
    },
    entidadeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    campo: {
        type: String,
        required: true,
        trim: true
    },
    valorCriptografado: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['cpf', 'rg', 'telefone', 'endereco', 'historico', 'laudo', 'observacao'],
        required: true
    },
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    dataCriacao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

dadosSensiveisSchema.index({ entidade: 1, entidadeId: 1, tipo: 1 });

module.exports = mongoose.model('DadosSensiveis', dadosSensiveisSchema);
