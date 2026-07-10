const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/posto-coleta';
        
        console.log('🔄 Conectando ao MongoDB...');
        console.log(`📍 URI: ${mongoURI}`);
        
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

module.exports = connectDB;
