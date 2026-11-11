const { fail, pick } = require("../utils/http");
const { comment } = require("./moderation");
const { rating } = require("./indicators");
const types = ["avaliacao", "problema", "sugestao"];
const statuses = ["novo", "em_analise", "concluido"];
function feedbackInput(body) {
  const input = pick(body, ["tipo", "nota", "comentario"]);
  const tipo = input.tipo === undefined ? "avaliacao" : input.tipo;
  if (!types.includes(tipo))
    fail(400, "Escolha avaliação, problema ou sugestão.");
  const nota = input.nota === undefined ? undefined : rating(input.nota);
  const comentario = comment(input.comentario);
  if (tipo === "avaliacao" && nota === undefined)
    fail(400, "Selecione uma nota de 1 a 5 para avaliar o sistema.");
  if (tipo !== "avaliacao" && !comentario)
    fail(400, "Descreva o problema ou a sugestão.");
  return { tipo, ...(nota === undefined ? {} : { nota }), comentario };
}
module.exports = { types, statuses, feedbackInput };
