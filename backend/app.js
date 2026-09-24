require("./config/env");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const mongoose = require("mongoose");
const { errorHandler } = require("./utils/http");
const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
const origins = (process.env.FRONTEND_URL || "http://localhost:5000")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || origins.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "OK" : "INDISPONIVEL",
    database: connected ? "conectado" : "desconectado",
  });
});
for (const name of [
  "auth",
  "auditoria",
  "pacientes",
  "medicos",
  "administradores",
  "agendamentos",
  "especialidades",
  "servicos",
  "laudos",
])
  app.use(`/api/${name}`, require(`./routes/${name}`));
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Rota não encontrada." }),
);
app.get(["/", "/index.html"], (req, res) => res.redirect("/index/index.html"));
app.use(express.static(path.join(__dirname, "../public")));
app.use((req, res) => res.status(404).send("Página não encontrada."));
app.use(errorHandler);
module.exports = app;
