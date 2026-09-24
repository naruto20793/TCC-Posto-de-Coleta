require("./env");
const crypto = require("crypto");
const secret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres em produção.");
}
module.exports = {
  JWT_SECRET: secret || crypto.randomBytes(48).toString("hex"),
  JWT_EXPIRES_IN: "8h",
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME_MS: 30 * 60 * 1000,
};
