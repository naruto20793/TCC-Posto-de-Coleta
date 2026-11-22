module.exports = require("./catalog")(require("../models/Servico"), [
  "nome",
  "tipo",
  "descricao",
  "duracao",
  "orientacoes",
  "especialidade",
  "ativo",
]);
