const mongoose = require("mongoose");
const { fail } = require("../utils/http");
const { dateKey } = require("./schedule");
const Agendamento = require("../models/Agendamento");
const Laudo = require("../models/Laudo");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const Servico = require("../models/Servico");
const Especialidade = require("../models/Especialidade");
const Usuario = require("../models/Usuario");
const Feedback = require("../models/FeedbackSistema");
const Auditoria = require("../models/Auditoria");
const sections = {
  atendimentos: "Consultas, exames e avaliações",
  laudos: "Laudos publicados",
  cadastros: "Pacientes e usuários",
  catalogo: "Médicos, serviços e especialidades",
  agendas: "Agendas dos médicos",
  comentarios: "Comentários sobre o sistema",
  auditoria: "Auditoria",
};
const statuses = Agendamento.schema.path("status").enumValues;
function parseFilters(query) {
  const result = {};
  for (const key of [
    "inicio",
    "fim",
    "medico",
    "especialidade",
    "servico",
    "status",
    "secoes",
  ])
    if (query[key] !== undefined && typeof query[key] !== "string")
      fail(400, "Filtros inválidos.");
  for (const key of ["inicio", "fim"])
    if (query[key]) result[key] = dateKey(query[key]);
  if (result.inicio && result.fim && result.inicio > result.fim)
    fail(400, "A data inicial deve ser anterior ou igual à data final.");
  for (const key of ["medico", "especialidade", "servico"])
    if (query[key]) {
      if (!/^[a-f\d]{24}$/i.test(query[key]))
        fail(400, "Filtro de cadastro inválido.");
      result[key] = query[key];
    }
  if (query.status) {
    if (!statuses.includes(query.status)) fail(400, "Situação inválida.");
    result.status = query.status;
  }
  result.secoes =
    query.secoes === undefined
      ? Object.keys(sections)
      : [...new Set(query.secoes.split(","))];
  if (
    !result.secoes.length ||
    result.secoes.some((s) => !Object.hasOwn(sections, s))
  )
    fail(400, "Selecione seções válidas para o relatório.");
  return result;
}
function period(filters, field, calendar = false) {
  const range = {};
  const suffix = calendar ? "T00:00:00Z" : "T00:00:00-03:00";
  if (filters.inicio) range.$gte = new Date(filters.inicio + suffix);
  if (filters.fim)
    range.$lt = new Date(new Date(filters.fim + suffix).getTime() + 86400000);
  return Object.keys(range).length ? { [field]: range } : {};
}
function appointmentFilter(filters, withPeriod = true) {
  const match = withPeriod ? period(filters, "data", true) : {};
  for (const key of ["medico", "especialidade", "servico"])
    if (filters[key]) match[key] = new mongoose.Types.ObjectId(filters[key]);
  if (filters.status) match.status = filters.status;
  return match;
}
const metric = (label, value) => ({ label, value: value ?? "Sem dados" });
const table = (title, columns, rows) => ({ title, columns, rows });
const group = (field) => [
  { $group: { _id: `$${field}`, total: { $sum: 1 } } },
  { $sort: { total: -1, _id: 1 } },
];
const rows = (data) => data.map((r) => [r._id ?? "Não informado", r.total]);
const average = (value) =>
  value == null ? "Sem avaliações" : `${value.toFixed(1)} / 5`;
const completed = { $eq: ["$status", "realizado"] };
const hasRating = (field) => ({
  $and: [completed, { $isNumber: `$${field}` }],
});
async function appointments(f) {
  const [data] = await Agendamento.aggregate([
    { $match: appointmentFilter(f) },
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              consultas: { $sum: 1 },
              realizados: { $sum: { $cond: [completed, 1, 0] } },
              exames: {
                $sum: {
                  $cond: [completed, { $ifNull: ["$examesRealizados", 0] }, 0],
                },
              },
              registrosExames: {
                $sum: {
                  $cond: [
                    { $and: [completed, { $isNumber: "$examesRealizados" }] },
                    1,
                    0,
                  ],
                },
              },
              avaliacoes: { $sum: { $cond: [hasRating("satisfacao"), 1, 0] } },
              satisfeitos: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        hasRating("satisfacao"),
                        { $gte: ["$satisfacao", 4] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              notaConsulta: {
                $avg: { $cond: [hasRating("satisfacao"), "$satisfacao", null] },
              },
              avaliacoesMedico: {
                $sum: { $cond: [hasRating("notaMedico"), 1, 0] },
              },
              notaMedico: {
                $avg: { $cond: [hasRating("notaMedico"), "$notaMedico", null] },
              },
            },
          },
        ],
        pacientes: [{ $group: { _id: "$paciente" } }, { $count: "total" }],
        status: group("status"),
        mensal: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$data",
                  timezone: "UTC",
                },
              },
              consultas: { $sum: 1 },
              realizados: { $sum: { $cond: [completed, 1, 0] } },
              exames: {
                $sum: {
                  $cond: [completed, { $ifNull: ["$examesRealizados", 0] }, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
        ...Object.fromEntries(
          [
            ["medicos", "medico", Medico.collection.name],
            ["servicos", "servico", Servico.collection.name],
            ["especialidades", "especialidade", Especialidade.collection.name],
          ].map(([key, field, from]) => [
            key,
            [
              ...group(field),
              { $limit: 50 },
              {
                $lookup: {
                  from,
                  localField: "_id",
                  foreignField: "_id",
                  as: "cadastro",
                },
              },
              {
                $project: {
                  total: 1,
                  nome: {
                    $ifNull: [
                      { $arrayElemAt: ["$cadastro.nome", 0] },
                      "Sem vínculo / cadastro removido",
                    ],
                  },
                },
              },
            ],
          ]),
        ),
      },
    },
  ]);
  const t = data.total[0] || {};
  return {
    metrics: [
      metric("Consultas", t.consultas || 0),
      metric("Realizadas", t.realizados || 0),
      metric(
        "Pacientes distintos nas consultas",
        data.pacientes[0]?.total || 0,
      ),
      metric("Exames realizados informados", t.exames || 0),
      metric(
        "Consultas com quantidade de exames informada",
        t.registrosExames || 0,
      ),
      metric("Avaliações de consultas", t.avaliacoes || 0),
      metric("Nota média das consultas", average(t.notaConsulta)),
      metric(
        "Satisfação (notas 4 e 5)",
        t.avaliacoes
          ? `${Math.round((100 * t.satisfeitos) / t.avaliacoes)}%`
          : "Sem avaliações",
      ),
      metric("Avaliações de médicos", t.avaliacoesMedico || 0),
      metric("Nota média dos médicos", average(t.notaMedico)),
    ],
    tables: [
      table(
        "Situação das consultas",
        ["Situação", "Quantidade"],
        rows(data.status),
      ),
      table(
        "Evolução mensal",
        ["Mês", "Consultas", "Realizadas", "Exames"],
        data.mensal.map((r) => [r._id, r.consultas, r.realizados, r.exames]),
      ),
      ...["medicos", "especialidades", "servicos"].map((key) =>
        table(
          `Consultas por ${key === "medicos" ? "médico" : key === "especialidades" ? "especialidade" : "serviço"} (até 50 grupos)`,
          ["Cadastro", "Consultas"],
          data[key].map((r) => [r.nome, r.total]),
        ),
      ),
    ],
  };
}
async function reports(f) {
  const match = { status: { $in: ["finalizado", "assinado"] } };
  if (f.medico) match.medico = new mongoose.Types.ObjectId(f.medico);
  const pipeline = [
    { $match: match },
    { $set: { dataRelatorio: { $ifNull: ["$publicadoEm", "$createdAt"] } } },
    { $match: period(f, "dataRelatorio") },
  ];
  if (f.especialidade || f.servico || f.status)
    pipeline.push(
      {
        $lookup: {
          from: Agendamento.collection.name,
          localField: "agendamento",
          foreignField: "_id",
          pipeline: [
            { $match: appointmentFilter(f, false) },
            { $project: { _id: 1 } },
          ],
          as: "consulta",
        },
      },
      { $match: { "consulta.0": { $exists: true } } },
    );
  const data = await Laudo.aggregate([...pipeline, ...group("status")]);
  return {
    metrics: [
      metric(
        "Laudos publicados",
        data.reduce((n, r) => n + r.total, 0),
      ),
    ],
    tables: [
      table("Publicações por situação", ["Situação", "Quantidade"], rows(data)),
    ],
  };
}
async function registrations(f) {
  const [patients, active, created, withCns, users, newUsers] =
    await Promise.all([
      Paciente.countDocuments(),
      Paciente.countDocuments({ ativo: true }),
      Paciente.countDocuments(period(f, "createdAt")),
      Paciente.countDocuments({ cns: { $type: "string", $regex: /^\d{15}$/ } }),
      Usuario.aggregate([
        {
          $group: {
            _id: { role: "$role", status: "$status" },
            total: { $sum: 1 },
          },
        },
        { $sort: { "_id.role": 1, "_id.status": 1 } },
      ]),
      Usuario.countDocuments(period(f, "createdAt")),
    ]);
  return {
    metrics: [
      metric("Pacientes cadastrados (atual)", patients),
      metric("Pacientes ativos (atual)", active),
      metric("Pacientes com CNS (atual)", withCns),
      metric("Pacientes cadastrados no período", created),
      metric("Usuários criados no período", newUsers),
    ],
    tables: [
      table(
        "Contas atuais por perfil e situação",
        ["Perfil", "Situação", "Quantidade"],
        users.map((r) => [r._id.role, r._id.status, r.total]),
      ),
    ],
  };
}
function doctorFilter(f) {
  return {
    ...(f.medico ? { _id: new mongoose.Types.ObjectId(f.medico) } : {}),
    ...(f.especialidade
      ? { especialidades: new mongoose.Types.ObjectId(f.especialidade) }
      : {}),
  };
}
async function catalog(f) {
  const filter = {
    ...(f.servico ? { _id: f.servico } : {}),
    ...(f.especialidade ? { especialidade: f.especialidade } : {}),
  };
  const [doctors, services, specialties, data] = await Promise.all([
    Medico.countDocuments(doctorFilter(f)),
    Servico.countDocuments(filter),
    Especialidade.countDocuments(
      f.especialidade ? { _id: f.especialidade } : {},
    ),
    Servico.find(filter)
      .select("nome duracao ativo")
      .sort({ nome: 1, _id: 1 })
      .limit(50)
      .lean(),
  ]);
  return {
    metrics: [
      metric("Médicos cadastrados", doctors),
      metric("Serviços cadastrados", services),
      metric("Especialidades cadastradas", specialties),
    ],
    tables: [
      table(
        "Serviços atuais (até 50)",
        ["Serviço", "Duração (min)", "Situação"],
        data.map((s) => [s.nome, s.duracao, s.ativo ? "Ativo" : "Inativo"]),
      ),
    ],
  };
}
async function agendas(f) {
  const data = await Medico.find(doctorFilter(f))
    .select("nome ativo horarioDisponivel horariosPorData")
    .sort({ nome: 1, _id: 1 })
    .limit(50)
    .lean();
  return {
    metrics: [],
    tables: [
      table(
        "Expediente atual dos médicos (até 50)",
        ["Médico", "Situação", "Dias", "Início", "Fim"],
        data.map((d) => [
          d.nome,
          d.ativo ? "Ativo" : "Inativo",
          d.horarioDisponivel?.diasSemana?.join(", ") || "Sem expediente",
          d.horarioDisponivel?.horaInicio || "—",
          d.horarioDisponivel?.horaFim || "—",
        ]),
      ),
      table(
        "Exceções por data (dos médicos listados)",
        ["Médico", "Data", "Horários liberados"],
        data.flatMap((d) =>
          Object.entries(d.horariosPorData || {})
            .filter(
              ([day]) =>
                (!f.inicio || day >= f.inicio) && (!f.fim || day <= f.fim),
            )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, hours]) => [
              d.nome,
              day,
              hours.length ? hours.join(", ") : "Dia bloqueado",
            ]),
        ),
      ),
    ],
  };
}
async function feedback(f) {
  const [data] = await Feedback.aggregate([
    { $match: period(f, "createdAt") },
    {
      $facet: {
        tipo: group("tipo"),
        status: group("status"),
        notas: [
          { $match: { tipo: "avaliacao", nota: { $type: "number" } } },
          {
            $group: { _id: null, media: { $avg: "$nota" }, total: { $sum: 1 } },
          },
        ],
      },
    },
  ]);
  return {
    metrics: [
      metric(
        "Comentários recebidos",
        data.tipo.reduce((n, r) => n + r.total, 0),
      ),
      metric("Avaliações do sistema", data.notas[0]?.total || 0),
      metric("Nota média do sistema", average(data.notas[0]?.media)),
    ],
    tables: [
      table("Tipos de comentários", ["Tipo", "Quantidade"], rows(data.tipo)),
      table(
        "Tratamento dos comentários",
        ["Situação", "Quantidade"],
        rows(data.status),
      ),
    ],
  };
}
async function audit(f) {
  const [data] = await Auditoria.aggregate([
    { $match: period(f, "data") },
    {
      $facet: {
        acao: group("acao"),
        status: group("status"),
        recurso: [...group("recurso"), { $limit: 50 }],
      },
    },
  ]);
  return {
    metrics: [
      metric(
        "Eventos registrados",
        data.acao.reduce((n, r) => n + r.total, 0),
      ),
    ],
    tables: [
      table("Ações", ["Ação", "Quantidade"], rows(data.acao)),
      table("Resultados", ["Resultado", "Quantidade"], rows(data.status)),
      table(
        "Recursos (até 50 grupos)",
        ["Recurso", "Quantidade"],
        rows(data.recurso),
      ),
    ],
  };
}
const scope = {
  atendimentos:
    "Período pela data da consulta. Todos os filtros se aplicam. Exames e avaliações consideram consultas realizadas; ausência de registro não significa zero exames.",
  laudos:
    "Período pela publicação (ou criação nos registros antigos). Apenas laudos publicados; especialidade, serviço e situação exigem consulta vinculada. Rascunhos e conteúdo clínico não são exibidos.",
  cadastros:
    "Totais atuais e novos cadastros no período. Filtros de médico, especialidade, serviço e situação da consulta não se aplicam.",
  catalogo:
    "Retrato atual, sem filtro de período. Médico e especialidade filtram os médicos; serviço e especialidade filtram os serviços; especialidade filtra o total de especialidades.",
  agendas:
    "Expediente atual, filtrado por médico e especialidade. O período filtra somente as exceções por data; serviço e situação não se aplicam.",
  comentarios:
    "Período pelo envio. Filtros de médico, especialidade, serviço e situação da consulta não se aplicam. Exibe totais, sem textos dos comentários.",
  auditoria:
    "Período pela data do evento. Filtros de médico, especialidade, serviço e situação da consulta não se aplicam.",
};
async function generateReport(filters) {
  const labels = [];
  for (const [key, Model, label] of [
    ["medico", Medico, "Médico"],
    ["especialidade", Especialidade, "Especialidade"],
    ["servico", Servico, "Serviço"],
  ]) {
    if (filters[key]) {
      const record = await Model.findById(filters[key]).select("nome").lean();
      if (!record) fail(400, `${label} não encontrado.`);
      labels.push(`${label}: ${record.nome}`);
    }
  }
  const handlers = {
    atendimentos: appointments,
    laudos: reports,
    cadastros: registrations,
    catalogo: catalog,
    agendas,
    comentarios: feedback,
    auditoria: audit,
  };
  return {
    geradoEm: new Date().toISOString(),
    filtros: filters,
    filtrosDescricao: [
      `Período: ${filters.inicio || "desde o início"} até ${filters.fim || "sem data final"}`,
      ...labels,
      `Situação da consulta: ${filters.status || "Todas"}`,
    ],
    secoes: await Promise.all(
      filters.secoes.map(async (key) => ({
        id: key,
        titulo: sections[key],
        descricao: scope[key],
        ...(await handlers[key](filters)),
      })),
    ),
  };
}
module.exports = {
  parseFilters,
  period,
  appointmentFilter,
  generateReport,
  sections,
  statuses,
};
