const express = require('express');
const router = express.Router();
const Servico = require('../models/Servico');

// GET - Listar todos os serviços
router.get('/', async (req, res) => {
    try {
        const servicos = await Servico.find({ ativo: true })
            .populate('especialidade', 'nome');
        res.json(servicos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter serviço por ID
router.get('/:id', async (req, res) => {
    try {
        const servico = await Servico.findById(req.params.id)
            .populate('especialidade', 'nome');
        
        if (!servico) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        
        res.json(servico);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo serviço
router.post('/', async (req, res) => {
    try {
        const servico = new Servico(req.body);
        await servico.save();
        await servico.populate('especialidade', 'nome');
        res.status(201).json(servico);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar serviço
router.put('/:id', async (req, res) => {
    try {
        const servico = await Servico.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('especialidade', 'nome');
        
        if (!servico) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        
        res.json(servico);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar serviço
router.delete('/:id', async (req, res) => {
    try {
        const servico = await Servico.findByIdAndDelete(req.params.id);
        
        if (!servico) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        
        res.json({ mensagem: 'Serviço deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
