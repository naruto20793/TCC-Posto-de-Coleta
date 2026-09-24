const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const mongoose = require("mongoose");
const {
  dateKey,
  slots,
  validateBooking,
} = require("../backend/services/schedule");
const { pick, id, page } = require("../backend/utils/http");
const app = require("../backend/app");
const Agendamento = require("../backend/models/Agendamento");
const Paciente = require("../backend/models/Paciente");
const Medico = require("../backend/models/Medico");

test("datas impossíveis e horários inválidos são rejeitados", () => {
  for (const date of ["2026-02-30", "24/09/2026", "", { $gt: "" }])
    assert.throws(() => dateKey(date));
  assert.equal(dateKey("2028-02-29"), "2028-02-29");
  assert.throws(() => slots("2028-02-29", "25:00", 30));
  assert.throws(() => slots("2028-02-29", "23:50", 30));
});
test("reservas sobrepostas compartilham chaves; horários adjacentes não", () => {
  const a = slots("2028-02-29", "09:00", 30);
  const b = slots("2028-02-29", "09:15", 30);
  const c = slots("2028-02-29", "09:30", 30);
  assert.equal(a.filter((x) => b.includes(x)).length, 15);
  assert.equal(a.filter((x) => c.includes(x)).length, 0);
});
test("agendamento valida futuro e expediente", () => {
  const date = new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10);
  const doctor = {
    horarioDisponivel: {
      diasSemana: [
        "domingo",
        "segunda",
        "terça",
        "quarta",
        "quinta",
        "sexta",
        "sábado",
      ],
      horaInicio: "08:00",
      horaFim: "17:00",
    },
  };
  assert.equal(validateBooking(date, "10:00", 30, doctor).length, 30);
  assert.throws(() => validateBooking(date, "17:00", 30, doctor));
  assert.throws(() => validateBooking("2000-01-01", "10:00", 30, doctor));
});
test("campos inesperados não atravessam a lista permitida", () => {
  assert.deepEqual(
    pick({ nome: "Ana", role: "super_admin", $set: { ativo: true } }, ["nome"]),
    { nome: "Ana" },
  );
  assert.throws(() => id({ $ne: null }));
  assert.equal(page({ query: { limit: 100000, page: -1 } }).limit, 100);
});
test("schema deriva reservas e libera cancelamento", async () => {
  const record = new Agendamento({
    paciente: new mongoose.Types.ObjectId(),
    medico: new mongoose.Types.ObjectId(),
    data: "2028-02-29",
    hora: "09:00",
  });
  await record.validate();
  assert.equal(record.reservaAtiva, true);
  assert.equal(record.slots.length, 30);
  record.status = "cancelado";
  await record.validate();
  assert.equal(record.reservaAtiva, false);
});
test("perfil normaliza CPF e médico tem expediente padrão", () => {
  const patient = new Paciente({ cpf: "123.456.789-00" });
  assert.equal(patient.cpf, "12345678900");
  const doctor = new Medico();
  assert.equal(doctor.horarioDisponivel.horaInicio, "08:00");
  assert.equal(doctor.horarioDisponivel.diasSemana.length, 5);
});
test("rotas clínicas recusam acesso sem sessão antes de consultar o banco", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of [
      "pacientes",
      "medicos",
      "agendamentos",
      "laudos",
      "administradores",
      "auditoria",
    ]) {
      for (const method of ["GET", "POST", "PUT", "DELETE"]) {
        const response = await fetch(`${base}/api/${route}`, { method });
        assert.equal(response.status, 401, `${method} ${route}`);
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    }
    assert.equal((await fetch(`${base}/api/health`)).status, 503);
    const bad = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: { $ne: "" }, senha: "password" }),
    });
    assert.equal(bad.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
