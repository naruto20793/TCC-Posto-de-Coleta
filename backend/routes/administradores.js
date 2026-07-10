const express = require('express');
const router = express.Router();
const Administrador = require('../models/Administrador');

// GET - Listar todos os administradores
router.get('/', async (req, res) => {
    try {
        const admins = await Administrador.find().select('-senha');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter administrador por ID
router.get('/:id', async (req, res) => {
    try {
        const admin = await Administrador.findById(req.params.id).select('-senha');
        
        if (!admin) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }
        
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo administrador
router.post('/', async (req, res) => {
    try {
        const admin = new Administrador(req.body);
        await admin.save();
        
        const adminSemSenha = admin.toObject();
        delete adminSemSenha.senha;
        
        res.status(201).json(adminSemSenha);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar administrador
router.put('/:id', async (req, res) => {
    try {
        const { senha, ...dadosAtualizacao } = req.body;
        
        const admin = await Administrador.findByIdAndUpdate(
            req.params.id,
            dadosAtualizacao,
            { new: true, runValidators: true }
        ).select('-senha');
        
        if (!admin) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }
        
        res.json(admin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar administrador
router.delete('/:id', async (req, res) => {
    try {
        const admin = await Administrador.findByIdAndDelete(req.params.id);
        
        if (!admin) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }
        
        res.json({ mensagem: 'Administrador deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
