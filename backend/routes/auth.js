const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { requireAuth, authorize } = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN, MAX_LOGIN_ATTEMPTS, LOCK_TIME_MS } = require('../config/security');

const router = express.Router();

const criarToken = (usuario) => {
    return jwt.sign(
        {
            sub: usuario._id.toString(),
            email: usuario.email,
            role: usuario.role,
            status: usuario.status
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+senha');

        if (!usuario || usuario.status === 'inativo') {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
            return res.status(423).json({ error: 'Conta bloqueada temporariamente. Tente novamente mais tarde.' });
        }

        const senhaValida = await usuario.compararSenha(senha);

        if (!senhaValida) {
            usuario.loginAttempts = (usuario.loginAttempts || 0) + 1;

            if (usuario.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                usuario.status = 'bloqueado';
                usuario.bloqueadoAte = new Date(Date.now() + LOCK_TIME_MS);
            }

            await usuario.save();
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        usuario.loginAttempts = 0;
        usuario.bloqueadoAte = null;
        usuario.ultimoLogin = new Date();
        usuario.ultimoAcesso = new Date();
        await usuario.save();

        const token = criarToken(usuario);

        return res.status(200).json({
            token,
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
                status: usuario.status,
                permissoes: usuario.permissoes || []
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao autenticar usuário.', detalhe: error.message });
    }
});

router.post('/register', requireAuth, authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const { nome, email, senha, role = 'paciente', permissoes = [] } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        const jaExiste = await Usuario.findOne({ email: email.toLowerCase() });
        if (jaExiste) {
            return res.status(409).json({ error: 'Já existe um usuário com este email.' });
        }

        const usuario = new Usuario({
            nome,
            email: email.toLowerCase(),
            senha,
            role,
            permissoes,
            status: 'ativo'
        });

        await usuario.save();

        return res.status(201).json({
            mensagem: 'Usuário criado com sucesso.',
            usuario: usuario.toPublicObject()
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao criar usuário.', detalhe: error.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    return res.status(200).json({
        usuario: {
            id: req.usuario._id,
            nome: req.usuario.nome,
            email: req.usuario.email,
            role: req.usuario.role,
            status: req.usuario.status,
            permissoes: req.usuario.permissoes || []
        }
    });
});

router.get('/usuarios', requireAuth, authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-senha');
        return res.status(200).json({ usuarios });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao consultar usuários.', detalhe: error.message });
    }
});

module.exports = router;
