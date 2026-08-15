const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Usuario = require('./models/Usuario');

const seedAdmin = async () => {
    try {
        await connectDB();

        const emailPadrao = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@posto.local').toLowerCase().trim();
        const senhaPadrao = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

        const usuarioExistente = await Usuario.findOne({ email: emailPadrao });

        if (usuarioExistente) {
            console.log('✅ Usuário administrador já existe.');
            return;
        }

        const admin = new Usuario({
            nome: 'Administrador do Sistema',
            email: emailPadrao,
            senha: senhaPadrao,
            role: 'super_admin',
            permissoes: [
                'gerenciar_usuarios',
                'gerenciar_roles',
                'visualizar_relatorios',
                'editar_agendamentos',
                'remover_registros',
                'acessar_logs'
            ],
            status: 'ativo'
        });

        await admin.save();

        console.log('✅ Usuário administrador criado com sucesso.');
        console.log(`Email: ${emailPadrao}`);
        console.log(`Senha: ${senhaPadrao}`);
    } catch (error) {
        console.error('❌ Erro ao criar usuário administrador:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();
