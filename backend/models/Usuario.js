const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: 120
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^(?:[^\s@]+)@(?:[^\s@]+\.)+[^\s@]{2,63}$/i, 'Por favor, forneça um email válido']
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'medico', 'paciente'],
        required: true,
        default: 'paciente'
    },
    permissoes: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'bloqueado'],
        default: 'ativo'
    },
    perfil: {
        model: {
            type: String,
            enum: ['Administrador', 'Medico', 'Paciente'],
            default: 'Paciente'
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },
    setor: {
        type: String,
        trim: true,
        default: null,
        maxlength: 80
    },
    unidade: {
        type: String,
        trim: true,
        default: null,
        maxlength: 120
    },
    matricula: {
        type: String,
        trim: true,
        default: null,
        maxlength: 50
    },
    ultimoLogin: {
        type: Date,
        default: null
    },
    ultimoAcesso: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    bloqueadoAte: {
        type: Date,
        default: null
    },
    doisFatoresAtivado: {
        type: Boolean,
        default: false
    },
    auditoriaAtiva: {
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

usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.senha = await bcrypt.hash(this.senha, salt);
        this.dataAtualizacao = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

usuarioSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

usuarioSchema.methods.toPublicObject = function() {
    const obj = this.toObject();
    delete obj.senha;
    return obj;
};

usuarioSchema.index({ email: 1 }, { unique: true });
usuarioSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);
