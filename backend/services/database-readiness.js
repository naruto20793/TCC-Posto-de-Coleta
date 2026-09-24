const Agendamento = require("../models/Agendamento");
const Usuario = require("../models/Usuario");
async function assertDatabaseReady() {
  try {
    const hello = await require("mongoose")
      .connection.db.admin()
      .command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid")
      throw new Error(
        "MongoDB precisa de replica set ou cluster com suporte a transações.",
      );
    const appointments = await Agendamento.collection.indexes();
    const users = await Usuario.collection.indexes();
    if (
      !["medico_horario_unico", "paciente_horario_unico"].every((name) =>
        appointments.some((i) => i.name === name && i.unique),
      )
    )
      throw new Error("Índices de agenda ausentes.");
    if (!users.some((i) => i.key.email === 1 && i.unique))
      throw new Error("Índice de usuário ausente.");
    if (
      await Agendamento.exists({
        status: { $in: ["agendado", "confirmado"] },
        $or: [
          { reservaAtiva: { $ne: true } },
          { slots: { $exists: false } },
          { slots: { $size: 0 } },
        ],
      })
    )
      throw new Error("Agendamentos legados precisam de migração.");
  } catch (error) {
    throw new Error(
      `Banco ainda não preparado: execute npm run db:check, npm run db:migrate e npm run db:indexes. ${error.message}`,
    );
  }
}
module.exports = assertDatabaseReady;
