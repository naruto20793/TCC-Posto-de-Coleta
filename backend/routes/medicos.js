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
  dayOverride,
  dayTimes,
  validateDay,
  validateTimes,
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
    .select("medico data hora duracao")
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
  const doctors = await Medico.find(
    filter.medico ? { _id: filter.medico } : {},
  ).session(session);
  const byId = new Map(doctors.map((d) => [String(d._id), d]));
  if (
    rows.some(
      (r) =>
        dayOverride(
          byId.get(String(r.medico)) || {},
          r.data.toISOString().slice(0, 10),
        ) === undefined &&
        (!schedule.diasSemana.includes(days[r.data.getUTCDay()]) ||
          minutes(r.hora) < minutes(schedule.horaInicio) ||
          minutes(r.hora) + r.duracao > minutes(schedule.horaFim)),
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
router.get(
  "/:id/disponibilidade",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const day = validateDay(req.query.data);
    const doctor = await Medico.findById(id(req.params.id));
    if (!doctor) fail(404, "Profissional não encontrado.");
    const booked = await Agendamento.find({
      medico: doctor._id,
      data: new Date(day),
      status: { $in: ["agendado", "confirmado"] },
    }).select("hora");
    res.json({
      data: day,
      horarios: dayTimes(doctor, day),
      personalizado: dayOverride(doctor, day) !== undefined,
      reservados: booked.map((r) => r.hora),
    });
  }),
);
router.put(
  "/:id/disponibilidade",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const day = validateDay(req.body.data);
    if (
      req.body.usarPadrao !== undefined &&
      typeof req.body.usarPadrao !== "boolean"
    )
      fail(400, "Opção inválida.");
    const times = req.body.usarPadrao
      ? undefined
      : validateTimes(req.body.horarios);
    await mutation(req, "editar", "disponibilidade-medico", async (session) => {
      const doctor = await Medico.findById(id(req.params.id)).session(session);
      if (!doctor) fail(404, "Profissional não encontrado.");
      if (!doctor.horariosPorData) doctor.horariosPorData = new Map();
      if (req.body.usarPadrao) doctor.horariosPorData.delete(day);
      else doctor.horariosPorData.set(day, times);
      const booked = await Agendamento.find({
        medico: doctor._id,
        data: new Date(day),
        status: { $in: ["agendado", "confirmado"] },
      })
        .select("hora duracao")
        .session(session);
      const effective = dayTimes(doctor, day);
      if (booked.some((r) => !effective.includes(r.hora)))
        fail(
          409,
          "Há consultas marcadas nesses horários. Reagende ou cancele antes de bloqueá-los.",
        );
      for (const key of doctor.horariosPorData.keys())
        if (
          key <
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
          }).format(new Date())
        )
          doctor.horariosPorData.delete(key);
      await doctor.save({ session });
      return doctor;
    });
    res.json({ message: "Disponibilidade atualizada." });
  }),
);
router.use(require("./profiles")(Medico, "medico"));
module.exports = router;
