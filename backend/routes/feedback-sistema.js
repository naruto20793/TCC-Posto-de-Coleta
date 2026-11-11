const router = require("express").Router();
const Feedback = require("../models/FeedbackSistema");
const { requireAuth, authorize, isAdmin } = require("../middleware/auth");
const { asyncRoute, fail, id, page } = require("../utils/http");
const { feedbackInput, statuses } = require("../services/system-feedback");
const mutation = require("../services/mutation");
router.use(requireAuth);
const scope = (user) => (isAdmin(user) ? {} : { usuario: user._id });
function visible(query, user) {
  query.select("usuario tipo nota comentario status createdAt updatedAt");
  return isAdmin(user) ? query.populate("usuario", "nome role") : query;
}
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    res.json(
      await visible(
        Feedback.find(scope(req.usuario))
          .sort({ createdAt: -1, _id: -1 })
          .skip(p.skip)
          .limit(p.limit),
        req.usuario,
      ),
    );
  }),
);
router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const record = await visible(
      Feedback.findOne({ ...scope(req.usuario), _id: id(req.params.id) }),
      req.usuario,
    );
    if (!record) fail(404, "Comentário não encontrado.");
    res.json(record);
  }),
);
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const data = feedbackInput(req.body);
    const record = await mutation(
      req,
      "criar",
      "feedback-sistema",
      async (session) =>
        (
          await Feedback.create([{ ...data, usuario: req.usuario._id }], {
            session,
          })
        )[0],
    );
    res.status(201).json(record);
  }),
);
router.patch(
  "/:id",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    if (!statuses.includes(req.body.status)) fail(400, "Andamento inválido.");
    const record = await mutation(
      req,
      "editar",
      "feedback-sistema",
      async (session) => {
        const record = await Feedback.findById(id(req.params.id)).session(
          session,
        );
        if (!record) fail(404, "Comentário não encontrado.");
        record.status = req.body.status;
        await record.save({ session });
        return record;
      },
    );
    res.json({ _id: record._id, status: record.status });
  }),
);
module.exports = router;
