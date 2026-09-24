const Auditoria = require("../models/Auditoria");
async function audit(req, acao, recurso, session) {
  await Auditoria.create(
    [
      {
        usuario: req.usuario._id,
        nomeUsuario: req.usuario.nome,
        role: req.usuario.role,
        acao,
        recurso,
        categoria: "admin",
        ip: req.ip,
      },
    ],
    session ? { session } : {},
  );
}
module.exports = audit;
