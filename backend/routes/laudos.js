const router = require("express").Router();
const Laudo = require("../models/Laudo");
const Agendamento = require("../models/Agendamento");
const MovimentacaoLaudo = require("../models/MovimentacaoLaudo");
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
  const published = { status: { $in: ["finalizado", "assinado"] } };
  if (isAdmin(user)) return published;
  if (user.role === "medico")
    return { $or: [{ medico: profileId(user, "Medico") }, published] };
  return {
    paciente: profileId(user, "Paciente"),
    status: { $in: ["finalizado", "assinado"] },
  };
}
const populated = (q) =>
  q.populate("paciente", "nome").populate("medico", "nome crm");
async function publishCorrection(record, session) {
  if (!record.retifica) return;
  const previous = await Laudo.findById(record.retifica).session(session);
  if (!previous || previous.status === "rascunho" || previous.substituidoPor)
    fail(
      409,
      "A versão anterior já foi substituída ou não pode ser retificada.",
    );
  previous.substituidoPor = record._id;
  await previous.save({ session });
}
// O recebimento físico é independente da publicação digital do documento.
router.get(
  "/:id/distribuicao",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const laudo = await Laudo.findOne({
      _id: id(req.params.id),
      ...scope(req.usuario),
    });
    if (!laudo) fail(404, "Laudo não encontrado.");
    const p = page(req);
    const movimentos = await MovimentacaoLaudo.find({ laudo: laudo._id })
      .sort({ sequencia: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate("responsavel", "nome");
    res.json({ movimentos, page: p.page, limit: p.limit });
  }),
);
router.post(
  "/:id/distribuicao",
  authorize("admin", "super_admin"),
  asyncRoute(async (req, res) => {
    const next = {
      nao_registrado: "recebido",
      recebido: "disponivel",
      disponivel: "entregue",
    };
    const record = await mutation(
      req,
      "editar",
      "distribuicao-laudo",
      async (session) => {
        const laudo = await Laudo.findById(id(req.params.id)).session(session);
        if (!laudo || laudo.status === "rascunho")
          fail(404, "Laudo não encontrado.");
        if (laudo.substituidoPor)
          fail(409, "Registre a movimentação na versão retificada do laudo.");
        const current = laudo.distribuicao?.situacao || "nao_registrado";
        if (req.body.situacao !== next[current])
          fail(409, "Movimentação fora de sequência. Atualize o histórico.");
        let recebedor = "",
          vinculoRecebedor = "";
        if (req.body.situacao === "entregue") {
          if (
            typeof req.body.recebedor !== "string" ||
            !req.body.recebedor.trim() ||
            req.body.recebedor.trim().length > 120
          )
            fail(400, "Informe o nome de quem recebeu (até 120 caracteres).");
          if (!["paciente", "responsavel"].includes(req.body.vinculoRecebedor))
            fail(400, "Informe o vínculo de quem recebeu.");
          recebedor = req.body.recebedor.trim();
          vinculoRecebedor = req.body.vinculoRecebedor;
        }
        const sequencia = (laudo.distribuicao?.sequencia || 0) + 1;
        const data = new Date();
        await MovimentacaoLaudo.create(
          [
            {
              laudo: laudo._id,
              sequencia,
              data,
              situacao: req.body.situacao,
              responsavel: req.usuario._id,
              recebedor,
              vinculoRecebedor,
            },
          ],
          { session },
        );
        laudo.distribuicao = {
          situacao: req.body.situacao,
          sequencia,
          atualizadaEm: data,
        };
        await laudo.save({ session });
        return laudo;
      },
    );
    res.status(201).json(record);
  }),
);
router.post(
  "/:id/retificacoes",
  authorize("medico"),
  asyncRoute(async (req, res) => {
    if (
      typeof req.body.motivo !== "string" ||
      !req.body.motivo.trim() ||
      req.body.motivo.trim().length > 2000
    )
      fail(400, "Informe o motivo da retificação (até 2000 caracteres).");
    const record = await mutation(
      req,
      "criar",
      "retificacao-laudo",
      async (session) => {
        const previous = await Laudo.findOne({
          _id: id(req.params.id),
          medico: profileId(req.usuario, "Medico"),
        }).session(session);
        if (!previous) fail(404, "Laudo não encontrado.");
        if (previous.status === "rascunho" || previous.substituidoPor)
          fail(409, "Retifique somente a versão publicada atual.");
        const existing = await Laudo.findOne({
          retifica: previous._id,
        }).session(session);
        if (existing)
          fail(409, "Já existe uma retificação. Edite o rascunho existente.");
        const [draft] = await Laudo.create(
          [
            {
              ...pick(previous.toObject(), [
                "titulo",
                "descricao",
                "resultados",
                "conclusao",
                "recomendacoes",
              ]),
              paciente: previous.paciente,
              medico: previous.medico,
              agendamento: previous.agendamento,
              retifica: previous._id,
              versao: (previous.versao || 1) + 1,
              motivoRetificacao: req.body.motivo.trim(),
              status: "rascunho",
            },
          ],
          { session },
        );
        return draft;
      },
    );
    res.status(201).json(record);
  }),
);
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const p = page(req);
    res.json(
      await populated(
        Laudo.find(
          req.query.meus === "1"
            ? {
                paciente: profileId(req.usuario, "Paciente"),
                status: { $in: ["finalizado", "assinado"] },
              }
            : scope(req.usuario),
        )
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
    const status = req.body.status === undefined ? "rascunho" : req.body.status;
    if (!["rascunho", "finalizado"].includes(status))
      fail(400, "Escolha salvar rascunho ou publicar o laudo.");
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
                status,
                ...(status === "finalizado" ? { publicadoEm: new Date() } : {}),
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
        fail(409, "Laudo publicado não pode ser alterado.");
      if (
        req.body.status !== undefined &&
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
      if (req.body.status === "finalizado") {
        await publishCorrection(record, session);
        record.publicadoEm = new Date();
      }
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
