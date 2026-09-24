module.exports = require("./catalog")(require("../models/Servico"), [
  "nome",
  "descricao",
  "duracao",
  "valor",
  "categoria",
  "ativo",
]);
