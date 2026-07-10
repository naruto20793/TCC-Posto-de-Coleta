const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do serviço é obrigatório'],
        trim: true
    },
    descricao: {
        type: String
    },
    especialidade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Especialidade'
    },
    valor: {
        type: Number,
        required: true
    },
    duracao: {
        type: Number, // em minutos
        default: 30
    },
    ativo: {
        type: Boolean,
        default: true
    },
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

module.exports = mongoose.model('Servico', servicoSchema);
