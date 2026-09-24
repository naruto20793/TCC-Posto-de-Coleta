const router = require("express").Router();
const Agendamento = require("../models/Agendamento");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const Servico = require("../models/Servico");
const { requireAuth, isAdmin, profileId } = require("../middleware/auth");
const { asyncRoute, fail, pick, id, page } = require("../utils/http");
const { dateKey, validateBooking, minutes } = require("../services/schedule");
const mutation = require("../services/mutation");
router.use(requireAuth);
function scope(user) {
  if (isAdmin(user)) return {};
  if (user.role === "paciente")
    return { paciente: profileId(user, "Paciente") };
  if (user.role === "medico") return { medico: profileId(user, "Medico") };
  fail(403, "Acesso não permitido.");
}
function populated(query) {
  return query
    .populate("paciente", "nome")
    .populate("medico", "nome crm")
    .populate("especialidade", "nome")
    .populate("servico", "nome");
}
router.get(
  "/disponibilidade",
  asyncRoute(async (req, res) => {
    const medico = await Medico.findOne({
      _id: id(req.query.medico),
      ativo: true,
    });
    if (!medico) fail(404, "Profissional não encontrado.");
    const day = dateKey(req.query.data);
    const records = await Agendamento.find({
      medico: medico._id,
      data: new Date(day),
      status: { $in: ["agendado", "confirmado"] },
    }).select("hora duracao");
    const duration = 30;
    const horarios = [];
    for (let start = 0; start + duration <= 1440; start += 30) {
      const hora = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
      try {
        validateBooking(day, hora, duration, medico);
      } catch {
        continue;
      }
      if (
        !records.some(
          (r) =>
            start < minutes(r.hora) + r.duracao &&
            start + duration > minutes(r.hora),
        )
      )
        horarios.push(hora);
    }
    res.json({ horarios, duracao: duration });
  }),
);
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    res.json(
      await populated(
        Agendamento.find(scope(req.usuario))
          .sort({ data: -1, hora: -1, _id: -1 })
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
      Agendamento.findOne({ ...scope(req.usuario), _id: id(req.params.id) }),
    );
    if (!record) fail(404, "Agendamento não encontrado.");
    res.json(record);
  }),
);
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const data = pick(req.body, [
      "paciente",
      "medico",
      "data",
      "hora",
      "especialidade",
      "servico",
      "observacoes",
    ]);
    if (req.usuario.role === "paciente")
      data.paciente = profileId(req.usuario, "Paciente").toString();
    if (req.usuario.role === "medico")
      data.medico = profileId(req.usuario, "Medico").toString();
    const paciente = await Paciente.findOne({
      _id: id(data.paciente),
      ativo: true,
    });
    const medico = await Medico.findOne({ _id: id(data.medico), ativo: true });
    if (!paciente || !medico) fail(400, "Paciente ou médico não encontrado.");
    if (
      data.especialidade &&
      !medico.especialidades.some(
        (e) => e.toString() === id(data.especialidade),
      )
    )
      fail(400, "Especialidade não pertence ao profissional.");
    if (
      data.servico &&
      !(await Servico.exists({ _id: id(data.servico), ativo: true }))
    )
      fail(400, "Serviço não encontrado.");
    if (
      data.observacoes !== undefined &&
      (typeof data.observacoes !== "string" || data.observacoes.length > 2000)
    )
      fail(400, "Observações devem ter até 2000 caracteres.");
    data.data = dateKey(data.data);
    data.duracao = 30;
    validateBooking(data.data, data.hora, data.duracao, medico);
    const record = await mutation(
      req,
      "criar",
      "agendamento",
      async (session) => (await Agendamento.create([data], { session }))[0],
    );
    res.status(201).json(await populated(Agendamento.findById(record.id)));
  }),
);
async function changeStatus(req, res, cancel = false) {
  const record = await mutation(
    req,
    "editar",
    "agendamento",
    async (session) => {
      const record = await Agendamento.findOne({
        ...scope(req.usuario),
        _id: id(req.params.id),
      }).session(session);
      if (!record) fail(404, "Agendamento não encontrado.");
      const status = cancel ? "cancelado" : req.body.status;
      const allowed = {
        agendado: ["confirmado", "cancelado"],
        confirmado: ["realizado", "falta", "cancelado"],
      };
      if (req.usuario.role === "paciente" && status !== "cancelado")
        fail(403, "Paciente pode apenas cancelar.");
      if (!allowed[record.status]?.includes(status))
        fail(409, "Mudança de status não permitida.");
      if (
        ["realizado", "falta"].includes(status) &&
        Date.parse(
          `${record.data.toISOString().slice(0, 10)}T${record.hora}:00-03:00`,
        ) > Date.now()
      )
        fail(409, "Consulta ainda não ocorreu.");
      record.status = status;
      await record.save({ session });
      return record;
    },
  );
  res.json(await populated(Agendamento.findById(record.id)));
}
router.put(
  "/:id",
  asyncRoute((req, res) => changeStatus(req, res)),
);
router.delete(
  "/:id",
  asyncRoute((req, res) => changeStatus(req, res, true)),
);
module.exports = router;
