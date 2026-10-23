const mongoose = require("mongoose");
module.exports = mongoose.model(
  "HorarioPadrao",
  new mongoose.Schema(
    {
      _id: { type: String, default: "medicos" },
      diasSemana: [String],
      horaInicio: String,
      horaFim: String,
    },
    { timestamps: true },
  ),
);
