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
test("cadastro de teste é desativado por flag e sempre fechado em produção", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const oldMode = process.env.NODE_ENV,
    oldFlag = process.env.ALLOW_PUBLIC_TEST_REGISTRATION;
  try {
    process.env.NODE_ENV = "development";
    process.env.ALLOW_PUBLIC_TEST_REGISTRATION = "false";
    assert.equal(
      (await (await fetch(`${base}/api/auth/registration`)).json())
        .publicRegistration,
      false,
    );
    process.env.NODE_ENV = "production";
    process.env.ALLOW_PUBLIC_TEST_REGISTRATION = "true";
    assert.equal(
      (await (await fetch(`${base}/api/auth/registration`)).json())
        .publicRegistration,
      false,
    );
    const denied = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "super_admin" }),
    });
    assert.equal(denied.status, 401);
  } finally {
    if (oldMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldMode;
    if (oldFlag === undefined)
      delete process.env.ALLOW_PUBLIC_TEST_REGISTRATION;
    else process.env.ALLOW_PUBLIC_TEST_REGISTRATION = oldFlag;
    await new Promise((resolve) => server.close(resolve));
  }
});

test("criptografia autentica conteúdo e recusa chave errada ou ausente", () => {
  const {
    criptografar,
    descriptografar,
  } = require("../backend/utils/criptografia");
  const original = process.env.CRYPTO_KEY;
  try {
    process.env.CRYPTO_KEY = "unit-test-key-not-for-production-2026";
    const encrypted = criptografar("Texto clínico: teste");
    assert.notEqual(encrypted, criptografar("Texto clínico: teste"));
    assert.equal(descriptografar(encrypted), "Texto clínico: teste");
    assert.equal(descriptografar("Sintoma: dor: manhã"), "Sintoma: dor: manhã");
    assert.throws(() => descriptografar("enc:v1:inválido"));
    const tampered =
      encrypted.slice(0, -2) + (encrypted.endsWith("00") ? "01" : "00");
    assert.throws(() => descriptografar(tampered));
    process.env.CRYPTO_KEY = "different-key-not-for-production-2026";
    assert.throws(() => descriptografar(encrypted));
    delete process.env.CRYPTO_KEY;
    assert.throws(() => criptografar("Privado"));
  } finally {
    if (original === undefined) delete process.env.CRYPTO_KEY;
    else process.env.CRYPTO_KEY = original;
  }
});

test("serviço SUS dispensa valor e omite preço legado na serialização", async () => {
  const Servico = require("../backend/models/Servico");
  const service = new Servico({
    nome: "Coleta",
    orientacoes: "Consultar a equipe",
  });
  await service.validate();
  const legacy = Servico.hydrate({ nome: "Antigo", valor: 120 });
  assert.equal(legacy.toJSON().valor, undefined);
});

test("estatísticas públicas retornam apenas totais sem exigir autenticação", async (t) => {
  t.mock.method(Agendamento, "aggregate", async (pipeline) => {
    assert.deepEqual(pipeline[0], { $match: { status: "realizado" } });
    return [
      {
        totais: [
          {
            atendimentos: 25,
            exames: 40,
            registrosExames: 20,
            avaliacoes: 10,
            satisfeitos: 8,
          },
        ],
        mensal: [],
      },
    ];
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/estatisticas?paciente=qualquer`,
    );
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.exames, 40);
    assert.equal(data.satisfacao, 80);
    assert.equal(data.avaliacoes, 10);
    assert.equal(data.mensal.length, 6);
    assert.deepEqual(
      Object.keys(data).sort(),
      [
        "exames",
        "registrosExames",
        "atendimentos",
        "avaliacoes",
        "satisfacao",
        "mensal",
      ].sort(),
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("indicadores validam quantidades, notas e seis meses na virada do ano", () => {
  const {
    quantity,
    rating,
    months,
  } = require("../backend/services/indicators");
  for (const value of [-1, 1.5, "2", null, 1001])
    assert.throws(() => quantity(value));
  assert.equal(quantity(0), 0);
  for (const value of [0, 6, 1.5, "5", null])
    assert.throws(() => rating(value));
  assert.equal(rating(5), 5);
  assert.deepEqual(months(new Date("2027-01-01T01:00:00Z")), [
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
  ]);
});

test("moderação censura variações e preserva críticas e palavras legítimas", () => {
  const { censor, comment } = require("../backend/services/moderation");
  for (const value of [
    "PORRA",
    "p0rr@",
    "p.o.r.r.a",
    "p o r r a",
    "cú",
    "caralhoo",
    "FDP",
    "filho da puta",
  ]) {
    assert.match(censor(value), /\*/);
    assert.doesNotMatch(censor(value), /[a-z]/i);
  }
  for (const value of [
    "Demorou muito e não gostei.",
    "computador, cultura e cuidado",
    "Consulta ruim; médico pouco atencioso.",
  ])
    assert.equal(censor(value), value);
  assert.equal(comment("  atendimento bom  "), "atendimento bom");
  assert.equal(comment(), "");
  assert.throws(() => comment("a".repeat(1001)));
  assert.throws(() => comment({ texto: "teste" }));
});

test("login normaliza e-mail e CPF sem transformar entrada malformada em CPF", () => {
  const { identifier } = require("../backend/services/login");
  assert.deepEqual(identifier(" Pessoa@Example.Test "), {
    email: "pessoa@example.test",
  });
  assert.deepEqual(identifier("123.456.789-00"), { cpf: "12345678900" });
  assert.deepEqual(identifier("12345678900"), { cpf: "12345678900" });
  for (const input of [
    { $ne: null },
    null,
    12345678900,
    "abc12345678900",
    "",
    "123",
  ])
    assert.throws(() => identifier(input));
});
