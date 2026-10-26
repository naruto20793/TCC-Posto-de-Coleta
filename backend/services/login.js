const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const { fail } = require("../utils/http");
function identifier(value) {
  if (typeof value !== "string" || value.length > 254)
    fail(400, "Informe e-mail ou CPF válido.");
  const text = value.trim();
  if (text.includes("@")) return { email: text.toLowerCase() };
  if (!/^[\d.\-\s]+$/.test(text)) fail(400, "Informe e-mail ou CPF válido.");
  const cpf = text.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf)) fail(400, "Informe um CPF com 11 dígitos.");
  return { cpf };
}
async function findUser(value) {
  const key = identifier(value);
  if (key.email) return Usuario.findOne(key).select("+senha +tokenVersion");
  const profiles = await Promise.all([
    Paciente.findOne(key).select("_id"),
    Medico.findOne(key).select("_id"),
  ]);
  const filters = profiles.flatMap((p, i) =>
    p
      ? [
          {
            role: i ? "medico" : "paciente",
            "perfil.model": i ? "Medico" : "Paciente",
            "perfil.id": p._id,
          },
        ]
      : [],
  );
  if (profiles[0])
    filters.push({
      role: { $in: ["admin", "super_admin"] },
      pacienteId: profiles[0]._id,
    });
  if (!filters.length) return null;
  const users = await Usuario.find({ $or: filters })
    .select("+senha +tokenVersion")
    .limit(2);
  if (users.length > 1)
    fail(
      400,
      "Este CPF está vinculado a mais de uma conta. Entre com o e-mail da conta desejada.",
    );
  return users[0] || null;
}
module.exports = { identifier, findUser };
