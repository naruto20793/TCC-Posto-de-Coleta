const mongoose = require('mongoose');

const especialidadeSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome da especialidade é obrigatório'],
        unique: true,
        trim: true
    },
    descricao: {
        type: String
    },
    ativo: {
        type: Boolean,
        default: true
    },
    dataCriacao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Especialidade', especialidadeSchema);
