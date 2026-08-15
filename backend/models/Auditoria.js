const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    nomeUsuario: {
        type: String,
        trim: true,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'medico', 'paciente'],
        required: true
    },
    acao: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'criar', 'editar', 'visualizar', 'excluir', 'baixar', 'exportar', 'reset_senha', 'bloquear_usuario']
    },
    recurso: {
        type: String,
        required: true,
        trim: true
    },
    categoria: {
        type: String,
        enum: ['seguranca', 'paciente', 'medico', 'agenda', 'laudo', 'admin'],
        default: 'admin'
    },
    detalhes: {
        type: String,
        default: ''
    },
    ip: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['sucesso', 'falha', 'bloqueado'],
        default: 'sucesso'
    },
    data: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

auditoriaSchema.index({ usuario: 1, data: -1 });
auditoriaSchema.index({ recurso: 1, acao: 1, data: -1 });

module.exports = mongoose.model('Auditoria', auditoriaSchema);
