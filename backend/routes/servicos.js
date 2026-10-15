module.exports = require("./catalog")(require("../models/Servico"), [
  "nome",
  "descricao",
  "duracao",
  "orientacoes",
  "especialidade",
  "ativo",
]);
