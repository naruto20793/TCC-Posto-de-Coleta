const router = require("express").Router();
const Laudo = require("../models/Laudo");
const Agendamento = require("../models/Agendamento");
const {
  requireAuth,
  authorize,
  isAdmin,
  profileId,
} = require("../middleware/auth");
const { asyncRoute, fail, id, pick, page } = require("../utils/http");
const mutation = require("../services/mutation");
router.use(requireAuth);
function scope(user) {
  if (isAdmin(user)) return {};
  if (user.role === "medico") return { medico: profileId(user, "Medico") };
  return {
    paciente: profileId(user, "Paciente"),
    status: { $in: ["finalizado", "assinado"] },
  };
}
const populated = (q) =>
  q.populate("paciente", "nome").populate("medico", "nome crm");
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    res.json(
      await populated(
        Laudo.find(scope(req.usuario))
          .sort({ createdAt: -1, _id: -1 })
          .skip(p.skip)
          .limit(p.limit),
      ),
    );
  }),
);
router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const record = await populated(
      Laudo.findOne({ ...scope(req.usuario), _id: id(req.params.id) }),
    );
    if (!record) fail(404, "Laudo não encontrado.");
    res.json(record);
  }),
);
router.post(
  "/",
  authorize("medico"),
  asyncRoute(async (req, res) => {
    const appointment = await Agendamento.findOne({
      _id: id(req.body.agendamento),
      medico: profileId(req.usuario, "Medico"),
      status: "realizado",
    });
    if (!appointment) fail(400, "Selecione uma consulta realizada por você.");
    const data = pick(req.body, [
      "titulo",
      "descricao",
      "resultados",
      "conclusao",
      "recomendacoes",
    ]);
    const record = await mutation(
      req,
      "criar",
      "laudo",
      async (session) =>
        (
          await Laudo.create(
            [
              {
                ...data,
                paciente: appointment.paciente,
                medico: appointment.medico,
                agendamento: appointment._id,
                status: "rascunho",
              },
            ],
            { session },
          )
        )[0],
    );
    res.status(201).json(record);
  }),
);
router.put(
  "/:id",
  authorize("medico"),
  asyncRoute(async (req, res) => {
    const record = await mutation(req, "editar", "laudo", async (session) => {
      const record = await Laudo.findOne({
        _id: id(req.params.id),
        medico: profileId(req.usuario, "Medico"),
      }).session(session);
      if (!record) fail(404, "Laudo não encontrado.");
      if (record.status !== "rascunho")
        fail(409, "Laudo finalizado não pode ser alterado.");
      if (
        req.body.status &&
        !["rascunho", "finalizado"].includes(req.body.status)
      )
        fail(400, "Status inválido.");
      Object.assign(
        record,
        pick(req.body, [
          "titulo",
          "descricao",
          "resultados",
          "conclusao",
          "recomendacoes",
          "status",
        ]),
      );
      await record.save({ session });
      return record;
    });
    res.json(record);
  }),
);
router.delete("/:id", (req, res) =>
  res
    .status(405)
    .json({ error: "Laudos são preservados para manter o histórico." }),
);
module.exports = router;
