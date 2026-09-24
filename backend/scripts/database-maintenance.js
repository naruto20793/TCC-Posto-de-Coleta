require("../config/env");
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const Agendamento = require("../models/Agendamento");
const Laudo = require("../models/Laudo");
const Auditoria = require("../models/Auditoria");
const Especialidade = require("../models/Especialidade");
const Servico = require("../models/Servico");
const Administrador = require("../models/Administrador");
const { slots, dateKey } = require("../services/schedule");
const MODELS = [
  Usuario,
  Paciente,
  Medico,
  Agendamento,
  Laudo,
  Auditoria,
  Especialidade,
  Servico,
];
async function planMigration() {
  const errors = [],
    warnings = [],
    plans = [],
    reservationPlans = [];
  const users = await Usuario.find().select("+senha");
  const emails = new Map(users.map((user) => [user.email, user]));
  const reservations = new Set();
  const normalizationPlans = [];
  for (const [Model, role] of [
    [Paciente, "paciente"],
    [Medico, "medico"],
    [Administrador, "admin"],
  ]) {
    const cpfSeen = new Set();
    for (const profile of await Model.find().select("+senha")) {
      if (Model !== Administrador) {
        const cpf = String(profile.cpf || "").replace(/\D/g, "");
        if (!/^\d{11}$/.test(cpf) || cpfSeen.has(cpf))
          errors.push(
            `Perfil ${profile.id}: CPF inválido ou duplicado após normalização.`,
          );
        cpfSeen.add(cpf);
        if (cpf !== profile.cpf)
          normalizationPlans.push({ Model, id: profile._id, cpf });
      }
      const email = profile.email?.trim().toLowerCase();
      const user = emails.get(email);
      if (!email) {
        errors.push(`Perfil ${profile.id} sem email.`);
        continue;
      }
      if (
        user &&
        user.role !== role &&
        !(role === "admin" && user.role === "super_admin")
      ) {
        errors.push(
          `Perfil ${profile.id}: email já usado por outro tipo de conta.`,
        );
        continue;
      }
      if (user?.perfil?.id && user.perfil.id.toString() !== profile.id) {
        errors.push(`Perfil ${profile.id}: email vinculado a outro cadastro.`);
        continue;
      }
      if (user) {
        if (!user.perfil?.id)
          plans.push({ action: "link", user, profile, Model });
      } else {
        if (!/^\$2[aby]\$/.test(profile.senha || "")) {
          errors.push(
            `Perfil ${profile.id} sem hash bcrypt válido. Defina credencial segura antes de migrar.`,
          );
          continue;
        }
        plans.push({ action: "create", profile, role, Model });
        emails.set(email, { role, perfil: { id: profile._id } });
      }
    }
  }
  for (const appointment of await Agendamento.find()) {
    try {
      const keys = slots(
        appointment.data,
        appointment.hora,
        appointment.duracao,
      );
      const active = ["agendado", "confirmado"].includes(appointment.status);
      if (
        !(await Paciente.exists({ _id: appointment.paciente })) ||
        !(await Medico.exists({ _id: appointment.medico }))
      )
        errors.push(`Agendamento ${appointment.id} tem referência ausente.`);
      if (active)
        for (const key of keys)
          for (const owner of [
            `m:${appointment.medico}`,
            `p:${appointment.paciente}`,
          ]) {
            const unique = `${owner}:${key}`;
            if (reservations.has(unique))
              errors.push(
                `Agendamento ${appointment.id} tem sobreposição de horário.`,
              );
            reservations.add(unique);
          }
      reservationPlans.push({ appointment, slots: keys, reservaAtiva: active });
    } catch {
      errors.push(
        `Agendamento ${appointment.id} tem data, hora ou duração inválida.`,
      );
    }
  }
  for (const laudo of await Laudo.find()) {
    if (
      !(await Paciente.exists({ _id: laudo.paciente })) ||
      !(await Medico.exists({ _id: laudo.medico }))
    )
      errors.push(`Laudo ${laudo.id} tem referência ausente.`);
  }
  if (await Administrador.exists({}))
    warnings.push(
      "Administradores legados serão contas admin; promoção a super_admin deve ser explícita.",
    );
  return {
    errors: [...new Set(errors)],
    warnings,
    plans,
    reservationPlans,
    normalizationPlans,
  };
}
async function migrate(apply) {
  const plan = await planMigration();
  console.log(
    JSON.stringify(
      {
        mode: apply ? "aplicar" : "somente conferência",
        accounts: plan.plans.length,
        appointments: plan.reservationPlans.length,
        errors: plan.errors,
        warnings: plan.warnings,
      },
      null,
      2,
    ),
  );
  if (plan.errors.length)
    throw new Error(
      "Resolva os conflitos antes de aplicar; nenhum registro foi modificado.",
    );
  if (!apply) return;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of plan.normalizationPlans)
        await item.Model.updateOne(
          { _id: item.id },
          { $set: { cpf: item.cpf } },
          { session },
        );
      for (const item of plan.plans) {
        const perfil = { model: item.Model.modelName, id: item.profile._id };
        if (item.action === "link")
          await Usuario.updateOne(
            { _id: item.user._id, "perfil.id": null },
            { $set: { perfil } },
            { session },
          );
        else {
          // insertMany executa validação, mas não o hook save: preserva o hash bcrypt existente.
          await Usuario.insertMany(
            [
              {
                nome: item.profile.nome,
                email: item.profile.email,
                senha: item.profile.senha,
                role: item.role,
                perfil,
                status: item.profile.ativo ? "ativo" : "inativo",
              },
            ],
            { session },
          );
        }
      }
      for (const item of plan.reservationPlans)
        await Agendamento.updateOne(
          { _id: item.appointment._id },
          {
            $set: {
              slots: item.slots,
              reservaAtiva: item.reservaAtiva,
              data: new Date(dateKey(item.appointment.data)),
            },
          },
          { session },
        );
    });
  } finally {
    await session.endSession();
  }
  console.log(
    "Migração concluída; registros originais preservados. Execute npm run db:indexes.",
  );
}
async function indexes() {
  // createIndexes adiciona índices necessários, sem remover índices existentes.
  for (const Model of MODELS) await Model.createIndexes();
  console.log("Índices criados/verificados.");
}
async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error("Manutenção exige MONGODB_URI persistente.");
  try {
    await connectDB();
    if (process.argv.includes("--indexes")) await indexes();
    else await migrate(process.argv.includes("--apply"));
  } finally {
    await connectDB.disconnectDB();
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { planMigration, migrate, indexes };
