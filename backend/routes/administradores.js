const router = require("express").Router();
const { requireAuth, authorize } = require("../middleware/auth");
router.use(requireAuth, authorize("super_admin"));
router.use((req, res) =>
  res.status(410).json({
    error:
      "Administradores são gerenciados em /api/auth/usuarios e /api/auth/register.",
  }),
);
module.exports = router;
