module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'posto-coleta-super-secret-key-2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_TIME_MS: 30 * 60 * 1000,
    ROLE_PERMISSIONS: {
        super_admin: [
            'gerenciar_usuarios',
            'gerenciar_roles',
            'visualizar_relatorios',
            'editar_agendamentos',
            'remover_registros',
            'acessar_logs'
        ],
        admin: [
            'gerenciar_usuarios',
            'visualizar_relatorios',
            'editar_agendamentos',
            'gerenciar_servicos'
        ],
        medico: [
            'visualizar_pacientes',
            'criar_laudos',
            'editar_agendamentos',
            'visualizar_relatorios_pessoais'
        ],
        paciente: [
            'visualizar_perfil',
            'agendar_consultas',
            'visualizar_agendamentos',
            'visualizar_laudos'
        ]
    }
};
