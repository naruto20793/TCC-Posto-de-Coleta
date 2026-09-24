const crypto = require("crypto");

const ALGORITMO = "aes-256-gcm";
function chave() {
  if (!process.env.CRYPTO_KEY || process.env.CRYPTO_KEY.length < 32)
    throw new Error("CRYPTO_KEY deve ter pelo menos 32 caracteres.");
  return crypto.createHash("sha256").update(process.env.CRYPTO_KEY).digest();
}

function criptografar(texto) {
  if (!texto) return texto;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITMO, chave(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(texto), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function descriptografar(valor) {
  if (!valor || typeof valor !== "string") return valor;
  const [ivHex, tagHex, contentHex] = valor.split(":");
  if (!ivHex || !tagHex || !contentHex) return valor;

  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(contentHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITMO, chave(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error("Falha ao descriptografar. Verifique a chave configurada.");
  }
}

module.exports = {
  criptografar,
  descriptografar,
};
