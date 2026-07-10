const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
connectDB();

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static('../public'));

// Routes
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/medicos', require('./routes/medicos'));
app.use('/api/administradores', require('./routes/administradores'));
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/especialidades', require('./routes/especialidades'));
app.use('/api/servicos', require('./routes/servicos'));
app.use('/api/laudos', require('./routes/laudos'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Conectado ao MongoDB'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
