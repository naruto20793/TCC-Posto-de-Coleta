require("./config/env");
const connectDB = require("./config/database");
const Usuario = require("./models/Usuario");
async function seed() {
  if (!process.env.MONGODB_URI)
    throw new Error("Seed exige MONGODB_URI persistente.");
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!email || !senha || senha.length < 12 || Buffer.byteLength(senha) > 72)
    throw new Error(
      "Defina DEFAULT_ADMIN_EMAIL e DEFAULT_ADMIN_PASSWORD (12 a 72 bytes).",
    );
  try {
    await connectDB();
    if (await Usuario.exists({ email })) {
      console.log("Conta já existe; nenhuma senha ou permissão foi alterada.");
      return;
    }
    await Usuario.create({
      nome: "Administrador do Sistema",
      email,
      senha,
      role: "super_admin",
      perfil: { model: "Administrador", id: null },
    });
    console.log(
      "Administrador inicial criado. Remova a senha de bootstrap do ambiente.",
    );
  } finally {
    await connectDB.disconnectDB();
  }
}
if (require.main === module)
  seed().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = seed;
