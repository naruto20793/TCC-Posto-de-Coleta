const mongoose = require("mongoose");
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function pick(body, fields) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail(400, "Corpo inválido.");
  return Object.fromEntries(
    fields.filter((k) => Object.hasOwn(body, k)).map((k) => [k, body[k]]),
  );
}
function id(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value))
    fail(400, "Identificador inválido.");
  return value;
}
function page(req) {
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || 25, 1),
    100,
  );
  const number = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  return { limit, skip: (number - 1) * limit, page: number };
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message =
    status < 500 ? err.message : "Não foi possível concluir a operação.";
  if (err instanceof mongoose.Error.VersionError) {
    status = 409;
    message = "Registro alterado por outra sessão. Atualize a página.";
  }
  if (err.code === 11000) {
    status = 409;
    message = "Registro duplicado ou horário indisponível.";
  }
  if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError ||
    err.type === "entity.parse.failed"
  ) {
    status = 400;
    message = "Dados inválidos. Confira os campos enviados.";
  }
  if (status >= 500) console.error("Falha na operação:", err.name);
  res.status(status).json({ error: message });
}
module.exports = { asyncRoute, fail, pick, id, page, errorHandler };
