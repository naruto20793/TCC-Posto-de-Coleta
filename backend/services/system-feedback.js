const { fail, pick } = require("../utils/http");
const { comment } = require("./moderation");
const { rating } = require("./indicators");
const types = [
  "avaliacao",
  "problema",
  "sugestao",
  "elogio",
  "duvida",
  "reclamacao",
  "outro",
];
const statuses = ["novo", "em_analise", "concluido"];
function feedbackInput(body) {
  const input = pick(body, ["tipo", "nota", "comentario"]);
  const tipo = input.tipo === undefined ? "avaliacao" : input.tipo;
  if (!types.includes(tipo)) fail(400, "Escolha um tipo de comentário válido.");
  const nota = input.nota === undefined ? undefined : rating(input.nota);
  const comentario = comment(input.comentario);
  if (tipo === "avaliacao" && nota === undefined)
    fail(400, "Selecione uma nota de 1 a 5 para enviar uma avaliação.");
  if (tipo !== "avaliacao" && !comentario)
    fail(400, "Escreva um comentário para este tipo de envio.");
  return { tipo, ...(nota === undefined ? {} : { nota }), comentario };
}
module.exports = { types, statuses, feedbackInput };
