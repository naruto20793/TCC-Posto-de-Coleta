const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const administradorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    usuario: {
        type: String,
        required: [true, 'Usuário é obrigatório'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, forneça um email válido']
    },
    telefone: {
        type: String
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        select: false
    },
    nivel: {
        type: String,
        enum: ['super', 'gerente', 'operacional'],
        default: 'operacional'
    },
    permissoes: [{
        type: String
        // gerenciar_usuarios, gerenciar_agendamentos, visualizar_relatorios, etc
    }],
    ativo: {
        type: Boolean,
        default: true
    },
    ultimoAcesso: Date,
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

// Hash de senha antes de salvar
administradorSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.senha = await bcrypt.hash(this.senha, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar senha
administradorSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('Administrador', administradorSchema);
