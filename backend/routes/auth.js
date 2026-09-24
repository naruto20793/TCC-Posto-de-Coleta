const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const { requireAuth, authorize } = require("../middleware/auth");
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MAX_LOGIN_ATTEMPTS,
  LOCK_TIME_MS,
} = require("../config/security");
const { asyncRoute, fail, pick, page, id } = require("../utils/http");
const { createAccount } = require("../services/accounts");
const audit = require("../services/audit");
const mutation = require("../services/mutation");
const router = express.Router();
const dummyHash = bcrypt.hashSync("invalid-password-placeholder", 12);
function publicUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    perfil: user.perfil,
  };
}
router.post(
  "/login",
  require("../middleware/login-limit"),
  asyncRoute(async (req, res) => {
    const { email, senha } = req.body;
    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      Buffer.byteLength(senha) > 72
    )
      fail(400, "Informe email e senha válidos.");
    const user = await Usuario.findOne({
      email: email.trim().toLowerCase(),
    }).select("+senha +tokenVersion");
    if (user?.bloqueadoAte > new Date())
      fail(423, "Conta bloqueada por 30 minutos após tentativas incorretas.");
    const valid = await bcrypt.compare(senha, user?.senha || dummyHash);
    if (!user || user.status === "inativo" || !valid) {
      if (user && user.status !== "inativo") {
        const updated = await Usuario.findByIdAndUpdate(
          user._id,
          { $inc: { loginAttempts: 1 } },
          { new: true },
        );
        if (updated.loginAttempts >= MAX_LOGIN_ATTEMPTS)
          await Usuario.updateOne(
            { _id: user._id },
            {
              $set: {
                bloqueadoAte: new Date(Date.now() + LOCK_TIME_MS),
                status: "bloqueado",
              },
            },
          );
      }
      fail(401, "Credenciais inválidas.");
    }
    // Bloqueio sem prazo representa ação administrativa e não expira automaticamente.
    if (user.status === "bloqueado" && !user.bloqueadoAte)
      fail(403, "Conta bloqueada. Contate a administração.");
    user.status = "ativo";
    user.loginAttempts = 0;
    user.bloqueadoAte = null;
    user.ultimoLogin = new Date();
    user.ultimoAcesso = new Date();
    await user.save();
    req.usuario = user;
    await audit(req, "login", "sessao");
    const token = jwt.sign(
      { sub: user.id, version: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" },
    );
    res.json({ token, usuario: publicUser(user) });
  }),
);
router.get("/me", requireAuth, (req, res) =>
  res.json({ usuario: publicUser(req.usuario) }),
);
router.post(
  "/register",
  requireAuth,
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    res.status(201).json({ usuario: publicUser(await createAccount(req)) });
  }),
);
router.get(
  "/usuarios",
  requireAuth,
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const pagination = page(req);
    const users = await Usuario.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
    res.json({
      usuarios: users.map(publicUser),
      page: pagination.page,
      limit: pagination.limit,
    });
  }),
);
router.patch(
  "/senha",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { atual, nova } = req.body;
    if (
      typeof atual !== "string" ||
      typeof nova !== "string" ||
      nova.length < 8 ||
      Buffer.byteLength(nova) > 72
    )
      fail(400, "Nova senha deve ter de 8 a 72 bytes.");
    const user = await Usuario.findById(req.usuario._id).select(
      "+senha +tokenVersion",
    );
    if (!(await user.compararSenha(atual))) fail(400, "Senha atual incorreta.");
    user.senha = nova;
    user.tokenVersion += 1;
    await user.save();
    await audit(req, "reset_senha", "sessao");
    res.json({ mensagem: "Senha atualizada." });
  }),
);
router.patch(
  "/usuarios/:id/status",
  requireAuth,
  authorize("super_admin"),
  asyncRoute(async (req, res) => {
    id(req.params.id);
    if (req.params.id === req.usuario.id)
      fail(400, "Não é possível desativar sua própria conta.");
    if (!["ativo", "inativo"].includes(req.body.status))
      fail(400, "Status inválido.");
    const user = await mutation(
      req,
      "bloquear_usuario",
      "usuario",
      async (session) => {
        const record = await Usuario.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              status: req.body.status,
              loginAttempts: 0,
              bloqueadoAte: null,
            },
            $inc: { tokenVersion: 1 },
          },
          { new: true, session },
        );
        if (!record) fail(404, "Usuário não encontrado.");
        if (
          record.perfil?.id &&
          ["Paciente", "Medico"].includes(record.perfil.model)
        ) {
          const Model = require(`../models/${record.perfil.model}`);
          await Model.updateOne(
            { _id: record.perfil.id },
            { $set: { ativo: req.body.status === "ativo" } },
            { session },
          );
        }
        return record;
      },
    );
    res.json({ usuario: publicUser(user) });
  }),
);
module.exports = router;
