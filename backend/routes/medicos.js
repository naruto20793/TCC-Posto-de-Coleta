const router = require("express").Router();
const Medico = require("../models/Medico");
const Agendamento = require("../models/Agendamento");
const HorarioPadrao = require("../models/HorarioPadrao");
const { requireAuth, authorize } = require("../middleware/auth");
const { asyncRoute, id, fail } = require("../utils/http");
const {
  validateSchedule,
  defaultSchedule,
  minutes,
} = require("../services/schedule");
const mutation = require("../services/mutation");
router.use(requireAuth);
router.get(
  "/horario-padrao",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    res.json(
      (await HorarioPadrao.findById("medicos").lean()) || defaultSchedule,
    );
  }),
);
// Antes de alterar o expediente, preserve as consultas já marcadas.
async function checkAppointments(filter, schedule, session) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const rows = await Agendamento.find({
    ...filter,
    data: { $gte: new Date(today) },
    status: { $in: ["agendado", "confirmado"] },
  })
    .select("data hora duracao")
    .session(session);
  const days = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado",
  ];
  if (
    rows.some(
      (r) =>
        !schedule.diasSemana.includes(days[r.data.getUTCDay()]) ||
        minutes(r.hora) < minutes(schedule.horaInicio) ||
        minutes(r.hora) + r.duracao > minutes(schedule.horaFim),
    )
  )
    fail(
      409,
      "Há consultas marcadas fora deste expediente. Reagende ou cancele essas consultas antes de alterar o horário.",
    );
}
router.put(
  "/horario-padrao",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const schedule = validateSchedule(req.body.horarioDisponivel);
    if (
      req.body.aplicarTodos !== undefined &&
      typeof req.body.aplicarTodos !== "boolean"
    )
      fail(400, "Opção inválida.");
    const record = await mutation(
      req,
      "editar",
      "horario-padrao",
      async (session) => {
        if (req.body.aplicarTodos) {
          await checkAppointments({}, schedule, session);
          await Medico.updateMany(
            {},
            { $set: { horarioDisponivel: schedule } },
            { session },
          );
        }
        return HorarioPadrao.findByIdAndUpdate(
          "medicos",
          { $set: schedule },
          { upsert: true, new: true, session },
        );
      },
    );
    res.json(record);
  }),
);
router.put(
  "/:id/horario",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const doctorId = id(req.params.id);
    const schedule = validateSchedule(req.body.horarioDisponivel);
    const record = await mutation(
      req,
      "editar",
      "horario-medico",
      async (session) => {
        await checkAppointments({ medico: doctorId }, schedule, session);
        const doctor = await Medico.findByIdAndUpdate(
          doctorId,
          { $set: { horarioDisponivel: schedule } },
          { new: true, session },
        );
        if (!doctor) fail(404, "Profissional não encontrado.");
        return doctor;
      },
    );
    res.json(record);
  }),
);
router.use(require("./profiles")(Medico, "medico"));
module.exports = router;
