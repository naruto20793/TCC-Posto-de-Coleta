const router = require("express").Router();
const Auditoria = require("../models/Auditoria");
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/http");
router.use(requireAuth, authorize("super_admin", "admin"));
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const logs = await Auditoria.find()
      .sort({ data: -1 })
      .limit(200)
      .select("nomeUsuario role acao recurso categoria status data");
    res.json({ logs });
  }),
);
module.exports = router;
