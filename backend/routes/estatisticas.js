const router = require("express").Router();
const { asyncRoute } = require("../utils/http");
const Agendamento = require("../models/Agendamento");
const { months } = require("../services/indicators");
router.get(
  "/",
  asyncRoute(async (_req, res) => {
    const meses = months();
    const [result] = await Agendamento.aggregate([
      { $match: { status: "realizado" } },
      {
        $facet: {
          totais: [
            {
              $group: {
                _id: null,
                atendimentos: { $sum: 1 },
                exames: { $sum: "$examesRealizados" },
                registrosExames: {
                  $sum: { $cond: [{ $isNumber: "$examesRealizados" }, 1, 0] },
                },
                avaliacoes: {
                  $sum: { $cond: [{ $isNumber: "$satisfacao" }, 1, 0] },
                },
                satisfeitos: {
                  $sum: { $cond: [{ $gte: ["$satisfacao", 4] }, 1, 0] },
                },
              },
            },
          ],
          mensal: [
            {
              $match: {
                data: {
                  $gte: new Date(`${meses[0]}-01`),
                  $lt: new Date(
                    Date.UTC(
                      Number(meses[5].slice(0, 4)),
                      Number(meses[5].slice(5)),
                      1,
                    ),
                  ),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$data",
                    timezone: "UTC",
                  },
                },
                exames: { $sum: "$examesRealizados" },
              },
            },
          ],
        },
      },
    ]);
    const total = result?.totais?.[0] || {};
    res.json({
      exames: total.exames || 0,
      registrosExames: total.registrosExames || 0,
      atendimentos: total.atendimentos || 0,
      avaliacoes: total.avaliacoes || 0,
      satisfacao: total.avaliacoes
        ? Math.round((100 * total.satisfeitos) / total.avaliacoes)
        : null,
      mensal: meses.map((mes) => ({
        mes,
        exames: result?.mensal?.find((r) => r._id === mes)?.exames || 0,
      })),
    });
  }),
);
module.exports = router;
