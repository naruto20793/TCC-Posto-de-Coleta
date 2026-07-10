const express = require('express');
const router = express.Router();
const Agendamento = require('../models/Agendamento');

// GET - Listar todos os agendamentos
router.get('/', async (req, res) => {
    try {
        const agendamentos = await Agendamento.find()
            .populate('paciente', 'nome email telefone')
            .populate('medico', 'nome especialidades')
            .populate('servico')
            .populate('especialidade');
        res.json(agendamentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obter agendamento por ID
router.get('/:id', async (req, res) => {
    try {
        const agendamento = await Agendamento.findById(req.params.id)
            .populate('paciente')
            .populate('medico')
            .populate('servico')
            .populate('especialidade');
        
        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        
        res.json(agendamento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Criar novo agendamento
router.post('/', async (req, res) => {
    try {
        const agendamento = new Agendamento(req.body);
        await agendamento.save();
        await agendamento.populate([
            { path: 'paciente', select: 'nome email telefone' },
            { path: 'medico', select: 'nome especialidades' },
            { path: 'servico' },
            { path: 'especialidade' }
        ]);
        
        res.status(201).json(agendamento);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT - Atualizar agendamento
router.put('/:id', async (req, res) => {
    try {
        const agendamento = await Agendamento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate([
            { path: 'paciente', select: 'nome email telefone' },
            { path: 'medico', select: 'nome especialidades' },
            { path: 'servico' },
            { path: 'especialidade' }
        ]);
        
        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        
        res.json(agendamento);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Cancelar/deletar agendamento
router.delete('/:id', async (req, res) => {
    try {
        const agendamento = await Agendamento.findByIdAndDelete(req.params.id);
        
        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        
        res.json({ mensagem: 'Agendamento cancelado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
