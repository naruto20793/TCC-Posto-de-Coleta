const router = require("express").Router();
const Agendamento = require("../models/Agendamento");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const {
  activeUnit,
  examContext,
  available: unitAvailability,
} = require("../services/unit-booking");
const Servico = require("../models/Servico");
const { requireAuth, isAdmin, profileId } = require("../middleware/auth");
const { asyncRoute, fail, pick, id, page } = require("../utils/http");
const {
  dateKey,
  validateBooking,
  minutes,
  dayTimes,
  availabilityMessage,
} = require("../services/schedule");
const { comment } = require("../services/moderation");
const { quantity, rating } = require("../services/indicators");
const mutation = require("../services/mutation");
router.use(requireAuth);
function scope(user) {
  if (isAdmin(user)) return {};
  if (user.role === "paciente")
    return { paciente: profileId(user, "Paciente") };
  if (user.role === "medico") return { medico: profileId(user, "Medico") };
  fail(403, "Acesso não permitido.");
}
function populated(query, user) {
  // A consulta continua visível conforme o perfil, mas o comentário é privado do médico responsável.
  // Médicos já são limitados aos próprios atendimentos pelo escopo e pelas rotas de escrita.
  if (user?.role !== "medico") query.select("-observacoes");
  return query
    .populate("paciente", "nome")
    .populate("medico", "nome crm")
    .populate("especialidade", "nome")
    .populate("servico", "nome tipo")
    .populate("unidade", "nome tipo nivel endereco");
}
router.get(
  "/disponibilidade",
  asyncRoute(async (req, res) => {
    if (req.query.unidade && req.query.servico) {
      const day = dateKey(req.query.data);
      const context = await examContext(req.query, req.usuario);
      const options = await unitAvailability(context.doctors, day);
      const horarios = [...new Set(options.flatMap((d) => d.horarios))].sort();
      return res.json({
        horarios,
        duracao: 30,
        ...(horarios.length
          ? {}
          : {
              mensagem:
                "Não há horários livres de exame nesta unidade. Confira os médicos vinculados e suas agendas.",
            }),
      });
    }
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
    for (const hora of dayTimes(medico, day)) {
      const start = minutes(hora);
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
    res.json({
      horarios,
      duracao: duration,
      ...(horarios.length
        ? {}
        : { mensagem: availabilityMessage(medico, day) }),
    });
  }),
);
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    res.json(
      await populated(
        Agendamento.find(
          req.query.meus === "1"
            ? { paciente: profileId(req.usuario, "Paciente") }
            : scope(req.usuario),
        )
          .sort({ data: -1, hora: -1, _id: -1 })
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
    const record = await populated(
      Agendamento.findOne({ ...scope(req.usuario), _id: id(req.params.id) }),
      req.usuario,
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
      "unidade",
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
    if (!paciente) fail(400, "Paciente não encontrado.");
    const service = data.servico
      ? await Servico.findOne({ _id: id(data.servico), ativo: true })
      : null;
    if (data.servico && !service) fail(400, "Serviço não encontrado.");
    const exam = service?.tipo === "exame";
    if (service?.especialidade) {
      if (
        data.especialidade &&
        id(data.especialidade) !== String(service.especialidade)
      )
        fail(400, "Especialidade incompatível com o serviço.");
      data.especialidade = String(service.especialidade);
    }
    let medico;
    if (!exam) {
      medico = await Medico.findOne({ _id: id(data.medico), ativo: true });
      if (!medico) fail(400, "Médico não encontrado.");
      if (
        data.especialidade &&
        !medico.especialidades.some((e) => String(e) === id(data.especialidade))
      )
        fail(400, "Especialidade não pertence ao profissional.");
      if (data.unidade && String(medico.unidade) !== id(data.unidade))
        fail(400, "Médico não pertence à unidade selecionada.");
      if (medico.unidade) data.unidade = String(medico.unidade);
      else delete data.unidade; // Histórico e médicos antigos permanecem acessíveis até o vínculo administrativo.
    }
    data.tipoAtendimento = exam ? "exame" : "consulta";

    if (
      data.observacoes !== undefined &&
      (typeof data.observacoes !== "string" || data.observacoes.length > 2000)
    )
      fail(400, "Observações devem ter até 2000 caracteres.");
    data.data = dateKey(data.data);
    data.duracao = 30;
    if (!exam) validateBooking(data.data, data.hora, data.duracao, medico);
    const record = await mutation(
      req,
      "criar",
      "agendamento",
      async (session) => {
        if (exam) {
          const context = await examContext(data, req.usuario, session, true);
          const options = await unitAvailability(
            context.doctors,
            data.data,
            session,
          );
          medico = options.find((d) => d.horarios.includes(data.hora))?.doctor;
          if (!medico)
            fail(
              409,
              "Horário indisponível nesta unidade. Escolha outro horário.",
            );
          data.medico = String(medico._id);
          data.unidade = String(context.unit._id);
        } else if (data.unidade)
          await activeUnit(data.unidade, null, session, true);
        // Escritas concorrentes na disponibilidade e na reserva disputam o mesmo médico.
        const current = await Medico.findOneAndUpdate(
          { _id: medico._id, ativo: true },
          { $inc: { agendaVersao: 1 } },
          { new: true, session },
        );
        if (!current) fail(400, "Profissional não encontrado.");
        if (data.unidade && String(current.unidade) !== data.unidade)
          fail(409, "O vínculo do médico mudou. Atualize os horários.");
        validateBooking(data.data, data.hora, data.duracao, current);
        return (await Agendamento.create([data], { session }))[0];
      },
    );
    res
      .status(201)
      .json(await populated(Agendamento.findById(record.id), req.usuario));
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
      if (status === "realizado" && req.body.examesRealizados !== undefined)
        record.examesRealizados = quantity(req.body.examesRealizados);
      record.status = status;
      await record.save({ session });
      return record;
    },
  );
  res.json(await populated(Agendamento.findById(record.id), req.usuario));
}
router.put(
  "/:id",
  asyncRoute((req, res) => changeStatus(req, res)),
);
router.delete(
  "/:id",
  asyncRoute((req, res) => changeStatus(req, res, true)),
);
router.post(
  "/:id/avaliacao",
  asyncRoute(async (req, res) => {
    if (
      req.usuario.role !== "paciente" &&
      !(isAdmin(req.usuario) && req.usuario.pacienteId)
    )
      fail(403, "Somente o paciente pode avaliar seu próprio atendimento.");
    const tipo = req.body.tipo || "consulta";
    if (!["consulta", "medico"].includes(tipo))
      fail(400, "Tipo de avaliação inválido.");
    const nota = rating(req.body.nota);
    const comentario = comment(req.body.comentario);
    await mutation(req, "editar", "avaliacao", async (session) => {
      const record = await Agendamento.findOne({
        _id: id(req.params.id),
        paciente: profileId(req.usuario, "Paciente"),
        status: "realizado",
      })
        .select("+satisfacao")
        .session(session);
      if (!record) fail(404, "Atendimento realizado não encontrado.");
      if (tipo === "consulta") {
        if (record.satisfacao !== undefined) {
          // Avaliações anteriores à funcionalidade podem receber um comentário, sem alterar a nota.
          if (record.comentarioConsulta !== undefined || !comentario)
            fail(409, "Esta consulta já foi avaliada.");
        } else record.satisfacao = nota;
        record.comentarioConsulta = comentario;
        record.avaliacaoRegistrada = true;
      } else {
        if (record.notaMedico !== undefined)
          fail(409, "O médico já foi avaliado neste atendimento.");
        record.notaMedico = nota;
        record.comentarioMedico = comentario;
        record.avaliacaoMedicoRegistrada = true;
      }
      await record.save({ session });
      return record;
    });
    res.status(201).json({ message: "Obrigado pela sua avaliação!" });
  }),
);
module.exports = router;
