const express = require('express');
const router = express.Router();
const Laudo = require('../models/Laudo');

// GET - Listar todos os laudos
router.get('/', async (req, res) => {
    try {
        const laudos = await Laudo.find()
            .populate('paciente', 'nome')
            .populate('medico', 'nome crm')
            .populate('agendamento');
        res.json(laudos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter laudo por ID
router.get('/:id', async (req, res) => {
    try {
        const laudo = await Laudo.findById(req.params.id)
            .populate('paciente')
            .populate('medico')
            .populate('agendamento');
        
        if (!laudo) {
            return res.status(404).json({ error: 'Laudo não encontrado' });
        }
        
        res.json(laudo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo laudo
router.post('/', async (req, res) => {
    try {
        const laudo = new Laudo(req.body);
        await laudo.save();
        await laudo.populate([
            { path: 'paciente', select: 'nome' },
            { path: 'medico', select: 'nome crm' },
            { path: 'agendamento' }
        ]);
        
        res.status(201).json(laudo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar laudo
router.put('/:id', async (req, res) => {
    try {
        const laudo = await Laudo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate([
            { path: 'paciente', select: 'nome' },
            { path: 'medico', select: 'nome crm' },
            { path: 'agendamento' }
        ]);
        
        if (!laudo) {
            return res.status(404).json({ error: 'Laudo não encontrado' });
        }
        
        res.json(laudo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar laudo
router.delete('/:id', async (req, res) => {
    try {
        const laudo = await Laudo.findByIdAndDelete(req.params.id);
        
        if (!laudo) {
            return res.status(404).json({ error: 'Laudo não encontrado' });
        }
        
        res.json({ mensagem: 'Laudo deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
