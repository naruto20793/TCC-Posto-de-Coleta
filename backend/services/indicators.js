const { fail } = require("../utils/http");
function quantity(value) {
  if (!Number.isInteger(value) || value < 0 || value > 1000)
    fail(400, "Informe a quantidade de exames: inteiro de 0 a 1000.");
  return value;
}
function rating(value) {
  if (!Number.isInteger(value) || value < 1 || value > 5)
    fail(400, "Selecione uma nota de 1 a 5.");
  return value;
}
function months(now = new Date()) {
  const current = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(current.find((p) => p.type === "year").value);
  const month = Number(current.find((p) => p.type === "month").value);
  return Array.from({ length: 6 }, (_, i) =>
    new Date(Date.UTC(year, month - 6 + i, 1)).toISOString().slice(0, 7),
  );
}
module.exports = { quantity, rating, months };
