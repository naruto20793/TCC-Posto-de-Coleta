const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.join(__dirname, "../public");
const user = {
  id: "111111111111111111111111",
  nome: "Teste",
  email: "test@example.test",
  role: "admin",
  perfil: { model: "Administrador", id: null },
};
async function setup(script, role = "admin", extra = []) {
  const dom = new JSDOM('<main id="app"></main>', {
    url: "http://localhost:5000",
    runScripts: "outside-only",
  });
  const w = dom.window,
    requests = [];
  const errors = [];
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.addEventListener("error", (e) => errors.push(e.error));
  const current = {
    ...user,
    role,
    perfil:
      role === "paciente" ? { model: "Paciente", id: user.id } : user.perfil,
  };
  if (role)
    w.sessionStorage.setItem(
      "posto.session.v2",
      JSON.stringify({ token: "test-token", usuario: current }),
    );
  w.localStorage.setItem("pacientes", "preservar dados legados");
  w.fetch = async (url, options) => {
    requests.push({ url, options });
    let data = {};
    if (url === "/api/auth/me") data = { usuario: current };
    else if (url === "/api/auth/registration")
      data = { publicRegistration: true };
    else if (url.startsWith("/api/especialidades"))
      data = [{ _id: "222222222222222222222222", nome: "Clínica" }];
    else if (url.startsWith("/api/medicos"))
      data = [
        {
          _id: "333333333333333333333333",
          nome: "Médico",
          crm: "123/SC",
          especialidades: [],
        },
      ];
    else if (url.startsWith("/api/agendamentos/disponibilidade"))
      data = { horarios: ["09:00"] };
    else if (url.startsWith("/api/laudos"))
      data = [
        {
          _id: "444444444444444444444444",
          titulo: "Teste <script>bad()</script>",
          descricao: "Resultado",
          status: "finalizado",
          paciente: { nome: "Teste" },
          medico: { nome: "Médico" },
        },
      ];
    else if (url.startsWith("/api/pacientes")) data = [];
    return { ok: true, status: 200, json: async () => data };
  };
  const load = (p) => w.eval(fs.readFileSync(path.join(root, p), "utf8"));
  load("assets/api.js");
  extra.forEach(load);
  load(script);
  // O evento real do JSDOM dispara após a instalação síncrona dos listeners.
  await new Promise((resolve) => setTimeout(resolve, 30));
  return { dom, w, requests, errors };
}
test("cadastro de paciente envia os campos para a API e só então informa sucesso", async () => {
  const { dom, w, requests, errors } = await setup(
    "cadastro/paciente/paciente.js",
    "admin",
    ["assets/cadastro.js"],
  );
  try {
    const form = w.document.getElementById("cadastro");
    assert.ok(form);
    for (const [name, value] of Object.entries({
      nome: "Paciente",
      email: "novo@example.test",
      senha: "senha12345",
      cpf: "12345678900",
      telefone: "48999999999",
      dataNascimento: "1990-01-01",
      genero: "Outro",
    }))
      form.elements[name].value = value;
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    const request = requests.find((r) => r.url === "/api/auth/register");
    assert.ok(request);
    assert.equal(JSON.parse(request.options.body).role, "paciente");
    assert.match(
      w.document.getElementById("feedback").textContent,
      /Cadastro salvo/,
    );
    assert.equal(
      w.localStorage.getItem("pacientes"),
      "preservar dados legados",
    );
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});
test("agenda consulta a disponibilidade sem função de autenticação ausente", async () => {
  const { dom, w, requests, errors } = await setup(
    "agendamento/agendamento.js",
    "paciente",
  );
  try {
    const doctor = w.document.getElementById("medico"),
      day = w.document.getElementById("data");
    assert.ok(doctor);
    assert.ok(day);
    doctor.value = "333333333333333333333333";
    day.value = "2026-10-01";
    day.dispatchEvent(new w.Event("change"));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.ok(
      requests.some((r) =>
        r.url.startsWith("/api/agendamentos/disponibilidade"),
      ),
    );
    assert.equal(w.document.getElementById("hora").disabled, false);
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});
test("laudos usam sessão normalizada e escapam conteúdo clínico", async () => {
  const { dom, w, errors } = await setup("laudo/laudo.js", "paciente");
  try {
    assert.match(
      w.document.getElementById("app").textContent,
      /Teste <script>bad\(\)<\/script>/,
    );
    assert.equal(w.document.querySelectorAll("article script").length, 0);
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});
test("todos os scripts e estilos locais das páginas existem", () => {
  function walk(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      );
  }
  for (const file of walk(root).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
      if (/^https?:/.test(match[1])) continue;
      const target = match[1].startsWith("/")
        ? path.join(root, match[1])
        : path.resolve(path.dirname(file), match[1]);
      assert.ok(fs.existsSync(target), `${file}: ${match[1]}`);
    }
  }
});
test("cadastro público escolhe qualquer nível e só envia dados clínicos quando aplicável", async () => {
  const { dom, w, requests, errors } = await setup(
    "cadastro/conta/conta.js",
    null,
  );
  try {
    const form = w.document.getElementById("testRegistration");
    assert.ok(form);
    for (const role of ["paciente", "medico", "admin", "super_admin"]) {
      form.elements.role.value = role;
      form.elements.role.dispatchEvent(new w.Event("change"));
      for (const [name, value] of Object.entries({
        nome: "Pessoa de teste",
        email: `${role}@example.test`,
        senha: "senha12345",
        cpf: "12345678900",
        telefone: "48999999999",
        dataNascimento: "1990-01-01",
        genero: "Outro",
        crm: "12345/SC",
      }))
        form.elements[name].value = value;
      form.elements.role.value = role;
      form.elements.role.dispatchEvent(new w.Event("change"));
      form.dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 15));
      const registration = requests
        .filter((r) => r.url === "/api/auth/register")
        .at(-1);
      assert.ok(registration);
      const body = JSON.parse(registration.options.body);
      assert.equal(body.role, role);
      assert.equal(registration.options.headers?.Authorization, undefined);
      if (role === "medico") assert.deepEqual(body.especialidades, []);
      if (["admin", "super_admin"].includes(role))
        assert.equal(body.cpf, undefined);
    }
    assert.match(
      w.document.getElementById("feedback").textContent,
      /Conta criada/,
    );
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});
