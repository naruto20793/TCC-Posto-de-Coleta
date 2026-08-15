const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/security');
const Usuario = require('../models/Usuario');

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticação ausente.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findById(decoded.sub).select('+senha');

        if (!usuario || usuario.status !== 'ativo') {
            return res.status(401).json({ error: 'Usuário não autorizado ou inativo.' });
        }

        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
            return res.status(423).json({ error: 'Conta temporariamente bloqueada.' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        if (!rolesPermitidos.length || rolesPermitidos.includes(req.usuario.role)) {
            return next();
        }

        return res.status(403).json({ error: 'Você não tem permissão para esta ação.' });
    };
};

module.exports = {
    requireAuth,
    authorize
};
