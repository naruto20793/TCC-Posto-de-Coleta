const express = require('express');
const router = express.Router();
const Paciente = require('../models/Paciente');

// GET - Listar todos os pacientes
router.get('/', async (req, res) => {
    try {
        const pacientes = await Paciente.find().select('-senha');
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter paciente por ID
router.get('/:id', async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id).select('-senha');
        
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }
        
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo paciente
router.post('/', async (req, res) => {
    try {
        const paciente = new Paciente(req.body);
        await paciente.save();
        
        const pacienteSemSenha = paciente.toObject();
        delete pacienteSemSenha.senha;
        
        res.status(201).json(pacienteSemSenha);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar paciente
router.put('/:id', async (req, res) => {
    try {
        const { senha, ...dadosAtualizacao } = req.body;
        
        const paciente = await Paciente.findByIdAndUpdate(
            req.params.id,
            dadosAtualizacao,
            { new: true, runValidators: true }
        ).select('-senha');
        
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }
        
        res.json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar paciente
router.delete('/:id', async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndDelete(req.params.id);
        
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }
        
        res.json({ mensagem: 'Paciente deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
