const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/security");
const Usuario = require("../models/Usuario");
const { asyncRoute, fail } = require("../utils/http");
const requireAuth = asyncRoute(async (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    fail(401, "Sessão inválida ou expirada. Faça login novamente.");
  }
  const usuario = await Usuario.findById(decoded.sub).select("+tokenVersion");
  if (
    !usuario ||
    decoded.version !== usuario.tokenVersion ||
    usuario.status !== "ativo"
  )
    fail(401, "Usuário inativo ou bloqueado.");
  if (usuario.bloqueadoAte > new Date())
    fail(423, "Conta temporariamente bloqueada.");
  req.usuario = usuario;
  next();
});
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.role))
      return res.status(403).json({ error: "Acesso não permitido." });
    next();
  };
const isAdmin = (usuario) => ["admin", "super_admin"].includes(usuario.role);
function profileId(usuario, model) {
  if (usuario.perfil?.model !== model || !usuario.perfil.id)
    fail(
      403,
      "Sua conta não possui um perfil vinculado. Contate a administração.",
    );
  return usuario.perfil.id;
}
module.exports = { requireAuth, authorize, isAdmin, profileId };
