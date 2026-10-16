const router = require("express").Router();
const { asyncRoute } = require("../utils/http");
const Agendamento = require("../models/Agendamento");
const Medico = require("../models/Medico");
const Servico = require("../models/Servico");
const Especialidade = require("../models/Especialidade");

// Totais públicos: sem identificadores, dados clínicos ou filtros individuais.
router.get(
  "/",
  asyncRoute(async (_req, res) => {
    const [atendimentos, profissionais, servicos, especialidades] =
      await Promise.all([
        Agendamento.countDocuments({ status: "realizado" }),
        Medico.countDocuments({ ativo: true }),
        Servico.countDocuments({ ativo: true }),
        Especialidade.countDocuments({}),
      ]);
    res.json({ atendimentos, profissionais, servicos, especialidades });
  }),
);
module.exports = router;
