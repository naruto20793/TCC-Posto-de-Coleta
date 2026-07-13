const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

let mongoServer;

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGODB_URI;
        
        // Se não houver URI definida e estiver em desenvolvimento, usar MongoDB Memory Server
        if (!mongoURI && process.env.NODE_ENV !== 'production') {
            console.log('🚀 Iniciando MongoDB Memory Server...');
            mongoServer = await MongoMemoryServer.create();
            mongoURI = mongoServer.getUri();
            console.log('✅ MongoDB Memory Server iniciado com sucesso');
        } else {
            mongoURI = mongoURI || 'mongodb://localhost:27017/posto-coleta';
        }
        
        console.log('🔄 Conectando ao MongoDB...');
        console.log(`📍 URI: ${mongoURI.substring(0, 50)}...`);
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`✅ MongoDB conectado com sucesso: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        process.exit(1);
    }
};

// Função para desconectar (útil para testes)
const disconnectDB = async () => {
    if (mongoServer) {
        await mongoServer.stop();
    }
    await mongoose.disconnect();
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
