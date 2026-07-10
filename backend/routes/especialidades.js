const express = require('express');
const router = express.Router();
const Especialidade = require('../models/Especialidade');

// GET - Listar todas as especialidades
router.get('/', async (req, res) => {
    try {
        const especialidades = await Especialidade.find({ ativo: true });
        res.json(especialidades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter especialidade por ID
router.get('/:id', async (req, res) => {
    try {
        const especialidade = await Especialidade.findById(req.params.id);
        
        if (!especialidade) {
            return res.status(404).json({ error: 'Especialidade não encontrada' });
        }
        
        res.json(especialidade);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar nova especialidade
router.post('/', async (req, res) => {
    try {
        const especialidade = new Especialidade(req.body);
        await especialidade.save();
        res.status(201).json(especialidade);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar especialidade
router.put('/:id', async (req, res) => {
    try {
        const especialidade = await Especialidade.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!especialidade) {
            return res.status(404).json({ error: 'Especialidade não encontrada' });
        }
        
        res.json(especialidade);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar especialidade
router.delete('/:id', async (req, res) => {
    try {
        const especialidade = await Especialidade.findByIdAndDelete(req.params.id);
        
        if (!especialidade) {
            return res.status(404).json({ error: 'Especialidade não encontrada' });
        }
        
        res.json({ mensagem: 'Especialidade deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
