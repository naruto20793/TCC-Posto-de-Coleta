const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const medicoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    crm: {
        type: String,
        required: [true, 'CRM é obrigatório'],
        unique: true
    },
    cpf: {
        type: String,
        required: [true, 'CPF é obrigatório'],
        unique: true,
        sparse: true
    },
    especialidades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Especialidade'
    }],
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, forneça um email válido']
    },
    telefone: {
        type: String,
        required: [true, 'Telefone é obrigatório']
    },
    dataNascimento: {
        type: Date,
        required: true
    },
    genero: {
        type: String,
        enum: ['M', 'F', 'Outro']
    },
    endereco: {
        rua: String,
        numero: String,
        complemento: String,
        bairro: String,
        cidade: String,
        estado: String,
        cep: String
    },
    horarioDisponivel: {
        diasSemana: [String], // segunda, terça, etc
        horaInicio: String,
        horaFim: String
    },
    senha: {
        type: String,
        select: false
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

// Hash de senha antes de salvar
medicoSchema.pre('save', async function(next) {
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
medicoSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('Medico', medicoSchema);
