const routerFactory = require("express").Router;
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute, id, fail, pick, page } = require("../utils/http");
const audit = require("../services/audit");
module.exports = (Model, fields) => {
  const router = routerFactory();
  router.get(
    "/",
    asyncRoute(async (req, res) => {
      const p = page(req);
      res.json(
        await Model.find(Model.modelName === "Servico" ? { ativo: true } : {})
          .sort({ nome: 1, _id: 1 })
          .skip(p.skip)
          .limit(p.limit),
      );
    }),
  );
  router.use(requireAuth, authorize("admin", "super_admin"));
  router.post(
    "/",
    asyncRoute(async (req, res) => {
      const record = await Model.create(pick(req.body, fields));
      await audit(req, "criar", `${Model.modelName}:${record.id}`);
      res.status(201).json(record);
    }),
  );
  router.put(
    "/:id",
    asyncRoute(async (req, res) => {
      const record = await Model.findByIdAndUpdate(
        id(req.params.id),
        { $set: pick(req.body, fields) },
        { new: true, runValidators: true },
      );
      if (!record) fail(404, "Registro não encontrado.");
      await audit(req, "editar", `${Model.modelName}:${record.id}`);
      res.json(record);
    }),
  );
  router.delete("/:id", (req, res) =>
    res.status(405).json({
      error:
        "Preserve o catálogo e suas referências. Serviços podem ser desativados pela edição.",
    }),
  );
  return router;
};
