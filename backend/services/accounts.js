const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");
const Especialidade = require("../models/Especialidade");
const { fail, pick, id } = require("../utils/http");
const audit = require("./audit");
const fields = [
  "nome",
  "cpf",
  "email",
  "telefone",
  "dataNascimento",
  "genero",
  "endereco",
];
async function createAccount(req, forcedRole) {
  const body = req.body;
  const role = forcedRole || body.role || "paciente";
  if (!["paciente", "medico", "admin", "super_admin"].includes(role))
    fail(400, "Perfil inválido.");
  if (
    ["admin", "super_admin"].includes(role) &&
    req.usuario.role !== "super_admin"
  )
    fail(403, "Somente super administrador pode criar administradores.");
  if (
    typeof body.senha !== "string" ||
    body.senha.length < 8 ||
    Buffer.byteLength(body.senha) > 72
  )
    fail(400, "Senha deve ter de 8 a 72 bytes.");
  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      let perfil = { model: "Administrador", id: null };
      if (["paciente", "medico"].includes(role)) {
        const data = pick(
          body,
          role === "medico"
            ? [...fields, "crm", "especialidades", "horarioDisponivel"]
            : fields,
        );
        if (role === "medico") {
          if (
            !Array.isArray(data.especialidades) ||
            !data.especialidades.length
          )
            fail(400, "Selecione uma especialidade.");
          data.especialidades.forEach(id);
          const count = await Especialidade.countDocuments({
            _id: { $in: data.especialidades },
          }).session(session);
          if (count !== new Set(data.especialidades).size)
            fail(400, "Especialidade não encontrada.");
        }
        const Model = role === "medico" ? Medico : Paciente;
        const [record] = await Model.create([data], { session });
        perfil = { model: Model.modelName, id: record._id };
      }
      [user] = await Usuario.create(
        [
          {
            nome: body.nome,
            email: body.email,
            senha: body.senha,
            role,
            perfil,
            status: "ativo",
          },
        ],
        { session },
      );
      await audit(req, "criar", `usuario:${user._id}`, session);
    });
    return user;
  } finally {
    await session.endSession();
  }
}
module.exports = { createAccount, fields };
