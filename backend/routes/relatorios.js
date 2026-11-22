const router = require("express").Router();
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/http");
const {
  parseFilters,
  generateReport,
  sections,
  statuses,
} = require("../services/reports");
const audit = require("../services/audit");
const reportPdf = require("../services/report-pdf");
router.use(requireAuth, authorize("admin", "super_admin"));
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const report = await generateReport(parseFilters(req.query));
    await audit(req, "visualizar", "relatorio-geral");
    res.json(report);
  }),
);
router.get(
  "/pdf",
  asyncRoute(async (req, res) => {
    const report = await generateReport(parseFilters(req.query));
    const buffer = await reportPdf(report);
    await audit(req, "exportar", "relatorio-geral");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="relatorio-geral.pdf"',
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  }),
);
router.get(
  "/opcoes",
  asyncRoute(async (_req, res) => {
    const [medicos, especialidades, servicos, unidades] = await Promise.all([
      require("../models/Medico")
        .find()
        .select("nome")
        .sort({ nome: 1 })
        .lean(),
      require("../models/Especialidade")
        .find()
        .select("nome")
        .sort({ nome: 1 })
        .lean(),
      require("../models/Servico")
        .find()
        .select("nome")
        .sort({ nome: 1 })
        .lean(),
      require("../models/UnidadeSaude")
        .find()
        .select("nome")
        .sort({ nome: 1 })
        .lean(),
    ]);
    res.json({
      medicos,
      unidades,
      especialidades,
      servicos,
      secoes: sections,
      status: statuses,
    });
  }),
);
module.exports = router;
