const express = require('express');
const Auditoria = require('../models/Auditoria');
const { requireAuth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const logs = await Auditoria.find()
            .sort({ data: -1 })
            .limit(200)
            .populate('usuario', 'nome email role');

        return res.status(200).json({ logs });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao consultar auditoria.', detalhe: error.message });
    }
});

module.exports = router;
