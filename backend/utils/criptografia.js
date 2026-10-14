const crypto = require("crypto");
const PREFIX = "enc:v1:";
const LEGACY = /^[a-f0-9]{32}:[a-f0-9]{32}:[a-f0-9]+$/i;
function chave() {
  if (!process.env.CRYPTO_KEY || process.env.CRYPTO_KEY.length < 32)
    throw new Error(
      "CRYPTO_KEY deve ter pelo menos 32 caracteres. Preserve a mesma chave para ler os dados.",
    );
  return crypto.createHash("sha256").update(process.env.CRYPTO_KEY).digest();
}
function isEncrypted(value) {
  return (
    typeof value === "string" &&
    (value.startsWith(PREFIX) || LEGACY.test(value))
  );
}
function criptografar(texto) {
  if (texto === undefined || texto === null || texto === "") return texto;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(texto), "utf8"),
    cipher.final(),
  ]);
  return `${PREFIX}${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}
function descriptografar(value) {
  if (!isEncrypted(value)) return value;
  const payload = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;
  if (!LEGACY.test(payload))
    throw new Error("Conteúdo criptografado inválido.");
  try {
    const [iv, tag, content] = payload
      .split(":")
      .map((x) => Buffer.from(x, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", chave(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(content), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    throw new Error("Falha ao descriptografar. Verifique a chave configurada.");
  }
}
module.exports = { criptografar, descriptografar, isEncrypted, chave };
