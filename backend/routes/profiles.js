const express = require("express");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const Agendamento = require("../models/Agendamento");
const {
  requireAuth,
  authorize,
  isAdmin,
  profileId,
} = require("../middleware/auth");
const { asyncRoute, fail, id, page, pick } = require("../utils/http");
const { createAccount } = require("../services/accounts");
const audit = require("../services/audit");
module.exports = function profileRoutes(Model, role) {
  const router = express.Router();
  router.use(requireAuth);
  async function scope(user) {
    if (isAdmin(user)) return {};
    if (role === "medico") return { ativo: true };
    if (user.role === "paciente") return { _id: profileId(user, "Paciente") };
    if (user.role === "medico") {
      const patients = await Agendamento.distinct("paciente", {
        medico: profileId(user, "Medico"),
        status: { $ne: "cancelado" },
      });
      return { _id: { $in: patients } };
    }
    fail(403, "Acesso não permitido.");
  }
  function projection(user) {
    return role === "medico" && !isAdmin(user)
      ? "nome crm especialidades horarioDisponivel"
      : "-senha";
  }
  router.get(
    "/",
    asyncRoute(async (req, res) => {
      const p = page(req);
      const filter = await scope(req.usuario);
      let query = Model.find(filter)
        .select(projection(req.usuario))
        .sort({ nome: 1, _id: 1 })
        .skip(p.skip)
        .limit(p.limit);
      if (role === "medico") query = query.populate("especialidades");
      res.json(await query);
    }),
  );
  router.get(
    "/:id",
    asyncRoute(async (req, res) => {
      id(req.params.id);
      const own =
        req.usuario.perfil?.id?.toString() === req.params.id &&
        req.usuario.perfil.model === Model.modelName;
      const record = await Model.findOne({
        $and: [await scope(req.usuario), { _id: req.params.id }],
      }).select(own ? "-senha" : projection(req.usuario));
      if (!record) fail(404, "Cadastro não encontrado.");
      res.json(record);
    }),
  );
  router.post(
    "/",
    authorize("admin", "super_admin"),
    asyncRoute(async (req, res) => {
      const user = await createAccount(req, role);
      res
        .status(201)
        .json(await Model.findById(user.perfil.id).select("-senha"));
    }),
  );
  router.put(
    "/:id",
    asyncRoute(async (req, res) => {
      id(req.params.id);
      const own =
        req.usuario.perfil?.id?.toString() === req.params.id &&
        req.usuario.perfil.model === Model.modelName;
      if (!isAdmin(req.usuario) && !own)
        fail(403, "Você só pode editar seu próprio cadastro.");
      const data = pick(req.body, ["nome", "telefone", "endereco"]);
      const session = await mongoose.startSession();
      let record;
      try {
        await session.withTransaction(async () => {
          record = await Model.findByIdAndUpdate(
            req.params.id,
            { $set: data },
            { new: true, runValidators: true, session },
          );
          if (!record) fail(404, "Cadastro não encontrado.");
          if (data.nome)
            await Usuario.updateOne(
              { "perfil.model": Model.modelName, "perfil.id": record._id },
              { $set: { nome: data.nome } },
              { session },
            );
          await audit(req, "editar", `${role}:${record.id}`, session);
        });
      } finally {
        await session.endSession();
      }
      res.json(record);
    }),
  );
  // Exclusão física deixaria laudos e consultas órfãos. A desativação é explícita.
  router.delete("/:id", authorize("admin", "super_admin"), (req, res) =>
    res.status(405).json({
      error:
        "Exclusão física desabilitada. Desative a conta pela gestão de usuários.",
    }),
  );
  return router;
};
