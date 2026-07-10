const express = require('express');
const router = express.Router();
const Medico = require('../models/Medico');

// GET - Listar todos os médicos
router.get('/', async (req, res) => {
    try {
        const medicos = await Medico.find()
            .populate('especialidades')
            .select('-senha');
        res.json(medicos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter médico por ID
router.get('/:id', async (req, res) => {
    try {
        const medico = await Medico.findById(req.params.id)
            .populate('especialidades')
            .select('-senha');
        
        if (!medico) {
            return res.status(404).json({ error: 'Médico não encontrado' });
        }
        
        res.json(medico);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo médico
router.post('/', async (req, res) => {
    try {
        const medico = new Medico(req.body);
        await medico.save();
        await medico.populate('especialidades');
        
        const medicoSemSenha = medico.toObject();
        delete medicoSemSenha.senha;
        
        res.status(201).json(medicoSemSenha);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar médico
router.put('/:id', async (req, res) => {
    try {
        const { senha, ...dadosAtualizacao } = req.body;
        
        const medico = await Medico.findByIdAndUpdate(
            req.params.id,
            dadosAtualizacao,
            { new: true, runValidators: true }
        ).populate('especialidades').select('-senha');
        
        if (!medico) {
            return res.status(404).json({ error: 'Médico não encontrado' });
        }
        
        res.json(medico);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Deletar médico
router.delete('/:id', async (req, res) => {
    try {
        const medico = await Medico.findByIdAndDelete(req.params.id);
        
        if (!medico) {
            return res.status(404).json({ error: 'Médico não encontrado' });
        }
        
        res.json({ mensagem: 'Médico deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
