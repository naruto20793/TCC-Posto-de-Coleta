const router = require("express").Router();
const Unidade = require("../models/UnidadeSaude");
const Servico = require("../models/Servico");
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute, pick, id, fail, page } = require("../utils/http");
const mutation = require("../services/mutation");
router.get("/tipos", (_req, res) =>
  res.json({ tipos: Unidade.tipos, niveis: Unidade.niveis }),
);
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    const filter = {};
    if (req.query.tipo) {
      if (!Unidade.tipos.includes(req.query.tipo)) fail(400, "Tipo inválido.");
      filter.tipo = req.query.tipo;
    }
    res.json(
      await Unidade.find(filter)
        .select("-versao")
        .sort({ nome: 1, _id: 1 })
        .skip(p.skip)
        .limit(p.limit),
    );
  }),
);
router.use(requireAuth, authorize("admin", "super_admin"));
async function write(req, res) {
  const data = pick(req.body, [
    "nome",
    "tipo",
    "nivel",
    "endereco",
    "telefone",
    "servicos",
    "ativo",
  ]);
  if (data.ativo !== undefined && typeof data.ativo !== "boolean")
    fail(400, "Situação inválida.");
  const record = await mutation(
    req,
    req.params.id ? "editar" : "criar",
    "unidade-saude",
    async (session) => {
      if (data.servicos !== undefined) {
        if (!Array.isArray(data.servicos)) fail(400, "Serviços inválidos.");
        data.servicos.forEach(id);
        data.servicos = [...new Set(data.servicos)];
        if (
          (await Servico.countDocuments({
            _id: { $in: data.servicos },
          }).session(session)) !== data.servicos.length
        )
          fail(400, "Serviço não encontrado.");
      }
      if (!req.params.id) return (await Unidade.create([data], { session }))[0];
      const unit = await Unidade.findByIdAndUpdate(
        id(req.params.id),
        { $set: data, $inc: { versao: 1 } },
        { new: true, runValidators: true, session },
      );
      if (!unit) fail(404, "Unidade não encontrada.");
      return unit;
    },
  );
  res.status(req.params.id ? 200 : 201).json(record);
}
router.post("/", asyncRoute(write));
router.put("/:id", asyncRoute(write));
router.delete("/:id", (_req, res) =>
  res
    .status(405)
    .json({
      error: "Desative a unidade para preservar os vínculos e o histórico.",
    }),
);
module.exports = router;
