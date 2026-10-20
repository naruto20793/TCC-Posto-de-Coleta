const router = require("express").Router();
const Paciente = require("../models/Paciente");
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute, fail } = require("../utils/http");
const audit = require("../services/audit");

// CPF no corpo evita incluir o documento em URLs e logs de acesso.
router.post(
  "/consultar-cpf",
  requireAuth,
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    if (typeof req.body?.cpf !== "string" || !/^[\d.\-\s]+$/.test(req.body.cpf))
      fail(400, "Informe um CPF com 11 dígitos.");
    const cpf = req.body.cpf.replace(/\D/g, "");
    if (!/^\d{11}$/.test(cpf)) fail(400, "Informe um CPF com 11 dígitos.");
    const paciente = await Paciente.findOne({ cpf }).select(
      "nome cpf email telefone dataNascimento genero endereco ativo",
    );
    if (!paciente) return res.json({ encontrado: false });
    await audit(req, "visualizar", `paciente:${paciente.id}`);
    res.json({ encontrado: true, paciente });
  }),
);
router.use(require("./profiles")(Paciente, "paciente"));
module.exports = router;
