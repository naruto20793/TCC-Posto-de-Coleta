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
async function setup(
  script,
  role = "admin",
  extra = [],
  statisticsFail = false,
) {
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
    if (url === "/api/estatisticas") {
      if (statisticsFail) throw new Error("offline");
      data = {
        exames: 0,
        registrosExames: 1,
        atendimentos: 2,
        avaliacoes: 0,
        satisfacao: null,
        mensal: Array.from({ length: 6 }, (_, i) => ({
          mes: `2026-${String(i + 5).padStart(2, "0")}`,
          exames: 0,
        })),
      };
    } else if (url.startsWith("/api/auth/usuarios")) data = { usuarios: [] };
    else if (url === "/api/auth/me") data = { usuario: current };
    else if (url === "/api/auth/registration")
      data = { publicRegistration: true };
    else if (url.startsWith("/api/especialidades"))
      data = [{ _id: "222222222222222222222222", nome: "Clínica" }];
    else if (url === "/api/medicos/horario-padrao")
      data = {
        diasSemana: ["segunda", "terça"],
        horaInicio: "09:15",
        horaFim: "16:45",
      };
    else if (url.startsWith("/api/medicos"))
      data = [
        {
          _id: "333333333333333333333333",
          nome: "Médico",
          crm: "123/SC",
          especialidades: [
            { _id: "222222222222222222222222", nome: "Clínica" },
          ],
        },
      ];
    else if (url.startsWith("/api/agendamentos/disponibilidade"))
      data = { horarios: ["09:00"] };
    else if (url.startsWith("/api/agendamentos"))
      data = [
        {
          _id: "666666666666666666666666",
          data: "2026-10-01",
          hora: "09:00",
          status: "realizado",
          paciente: { nome: "Paciente" },
          medico: { nome: "Médico" },
        },
      ];
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
    else if (url.startsWith("/api/servicos"))
      data = [
        {
          _id: "555555555555555555555555",
          nome: "Coleta",
          valor: 150,
          especialidade: "222222222222222222222222",
          orientacoes: "Consulte a equipe",
        },
      ];
    else if (url.startsWith("/api/pacientes"))
      data = [
        {
          _id: "777777777777777777777777",
          nome: "Ana Silva",
          cpf: "12345678900",
          ativo: true,
        },
        {
          _id: "888888888888888888888888",
          nome: "Bruno",
          cpf: "98765432100",
          ativo: true,
        },
      ];
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
    assert.equal(JSON.parse(request.options.body).senha, undefined);
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

test("catálogo SUS não exibe preços legados e encaminha o serviço escolhido", async () => {
  const { dom, w, errors } = await setup("servicos/servicos.js");
  try {
    const app = w.document.getElementById("app");
    assert.match(app.textContent, /gratuito/);
    assert.doesNotMatch(app.textContent, /150|R\$/);
    assert.match(
      app.querySelector("a").href,
      /servico=555555555555555555555555/,
    );
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});
test("serviço seleciona sua especialidade e limpa horário anterior", async () => {
  const { dom, w, errors } = await setup(
    "agendamento/agendamento.js",
    "paciente",
  );
  try {
    const service = w.document.getElementById("servico");
    service.value = "555555555555555555555555";
    service.dispatchEvent(new w.Event("change"));
    assert.equal(
      w.document.getElementById("especialidade").value,
      "222222222222222222222222",
    );
    assert.equal(w.document.getElementById("especialidade").disabled, true);
    assert.equal(w.document.getElementById("hora").disabled, true);
    assert.match(
      w.document.getElementById("orientacoes").textContent,
      /Consulte a equipe/,
    );
    assert.equal(w.document.getElementById("medico").options.length, 2);
    assert.equal(errors.length, 0);
  } finally {
    dom.window.close();
  }
});

test("visitante vê totais reais, inclusive zero, sem login", async () => {
  const { dom, w, requests } = await setup("index/script.js", null);
  try {
    const stats = w.document.getElementById("statistics-content");
    assert.equal(stats.querySelectorAll(".stat-number").length, 3);
    assert.equal(stats.querySelector(".stat-number").textContent, "0");
    assert.match(stats.textContent, /Ainda sem avaliações/);
    assert.equal(stats.querySelectorAll(".exam-chart-row").length, 6);
    assert.equal(stats.getAttribute("aria-busy"), "false");
    assert.ok(requests.some((r) => r.url === "/api/estatisticas"));
    assert.ok(!requests.some((r) => r.url === "/api/auth/me"));
  } finally {
    dom.window.close();
  }
});
test("falha nas estatísticas não inventa zeros nem bloqueia a página", async () => {
  const { dom, w } = await setup("index/script.js", null, [], true);
  try {
    assert.ok(w.document.getElementById("welcome-title"));
    assert.ok(w.document.getElementById("retry-statistics"));
    assert.equal(w.document.querySelectorAll(".stat-number").length, 0);
  } finally {
    dom.window.close();
  }
});

test("paciente avalia consulta e médico com comentários separados", async () => {
  const { dom, w, requests } = await setup(
    "consultas/consultas.js",
    "paciente",
  );
  try {
    assert.equal(w.document.querySelectorAll(".rating-form").length, 2);
    const form = w.document.querySelector('[data-type="medico"]');
    form.elements.nota.value = "4";
    form.elements.comentario.value = "Médico atencioso";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    const sent = requests.find((r) => r.url.endsWith("/avaliacao"));
    assert.deepEqual(JSON.parse(sent.options.body), {
      nota: 4,
      tipo: "medico",
      comentario: "Médico atencioso",
    });
  } finally {
    dom.window.close();
  }
});

test("admin cadastra serviço SUS sem preço e com especialidade", async () => {
  const { dom, w, requests } = await setup("perfil/adm/perfil.js");
  try {
    const form = w.document.getElementById("service");
    assert.ok(form);
    assert.equal(form.querySelector('[name="valor"]'), null);
    form.elements.nomeServico.value = "Hemograma";
    form.elements.especialidade.value = "222222222222222222222222";
    form.elements.descricao.value = "Exame laboratorial";
    form.elements.orientacoes.value = "Consulte a equipe";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    const req = requests.find(
      (r) => r.url === "/api/servicos" && r.options.method === "POST",
    );
    assert.ok(req);
    const body = JSON.parse(req.options.body);
    assert.equal(body.nome, "Hemograma");
    assert.equal(body.especialidade, "222222222222222222222222");
    assert.equal(body.valor, undefined);
  } finally {
    dom.window.close();
  }
});

test("busca CPF preenche cadastro e atualiza sem criar conta duplicada", async () => {
  const { dom, w, requests } = await setup(
    "cadastro/paciente/paciente.js",
    "admin",
    ["assets/cadastro.js"],
  );
  try {
    const original = w.fetch;
    w.fetch = async (url, options) => {
      if (url === "/api/pacientes/consultar-cpf") {
        requests.push({ url, options });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            encontrado: true,
            paciente: {
              _id: "777777777777777777777777",
              nome: "Pessoa existente",
              cpf: "12345678900",
              email: "existente@example.test",
              telefone: "48999990000",
              dataNascimento: "1990-01-01T00:00:00Z",
              genero: "Outro",
              endereco: { cidade: "Araranguá", rua: "Rua A" },
            },
          }),
        };
      }
      return original(url, options);
    };
    const form = w.document.getElementById("cadastro");
    form.elements.cpf.value = "123.456.789-00";
    form.elements.cpf.dispatchEvent(new w.Event("input"));
    w.document.getElementById("lookup-cpf").click();
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(form.elements.nome.value, "Pessoa existente");
    assert.equal(form.elements.endereco_cidade.value, "Araranguá");
    assert.equal(form.elements.senha, undefined);
    assert.equal(form.elements.email.disabled, true);
    form.elements.telefone.value = "48988880000";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(!requests.some((r) => r.url === "/api/auth/register"));
    const update = requests.find((r) => r.options.method === "PUT");
    assert.equal(update.url, "/api/pacientes/777777777777777777777777");
    assert.equal(JSON.parse(update.options.body).telefone, "48988880000");
    form.elements.cpf.value = "11122233344";
    form.elements.cpf.dispatchEvent(new w.Event("input"));
    assert.equal(form.elements.nome.value, "");
    assert.equal(form.elements.senha, undefined);
  } finally {
    dom.window.close();
  }
});

test("resposta de CPF anterior não preenche os dados de outro CPF", async () => {
  const { dom, w } = await setup("cadastro/paciente/paciente.js", "admin", [
    "assets/cadastro.js",
  ]);
  try {
    let resolve;
    w.fetch = () =>
      new Promise((r) => {
        resolve = r;
      });
    const form = w.document.getElementById("cadastro");
    form.elements.cpf.value = "12345678900";
    w.document.getElementById("lookup-cpf").click();
    await new Promise((r) => setTimeout(r, 0));
    form.elements.cpf.value = "11122233344";
    form.elements.cpf.dispatchEvent(new w.Event("input"));
    resolve({
      ok: true,
      status: 200,
      json: async () => ({
        encontrado: true,
        paciente: { _id: "777777777777777777777777", nome: "Pessoa anterior" },
      }),
    });
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(form.elements.nome.value, "");
  } finally {
    dom.window.close();
  }
});

test("troca de senha inicial confirma as duas senhas antes de enviar", async () => {
  const { dom, w, requests } = await setup("login/trocar-senha.js", "paciente");
  try {
    const form = w.document.getElementById("change-initial-password");
    assert.ok(form);
    form.elements.atual.value = "12345678900";
    form.elements.nova.value = "Nova-senha-2026";
    form.elements.confirmacao.value = "Outra-senha-2026";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 30));
    assert.match(
      w.document.getElementById("feedback").textContent,
      /não coincidem/,
    );
    assert.ok(!requests.some((r) => r.url === "/api/auth/senha"));
    w.alert = () => {};
    form.elements.confirmacao.value = "Nova-senha-2026";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 30));
    const change = requests.find((r) => r.url === "/api/auth/senha");
    assert.deepEqual(JSON.parse(change.options.body), {
      atual: "12345678900",
      nova: "Nova-senha-2026",
    });
  } finally {
    dom.window.close();
  }
});

test("cadastro de médico permite ajustar o expediente padrão", async () => {
  const { dom, w, requests, errors } = await setup(
    "cadastro/medico/medico.js",
    "admin",
    ["assets/horarios.js", "assets/cadastro.js"],
  );
  try {
    const form = w.document.getElementById("cadastro");
    assert.equal(form.elements.horaInicio.value, "09:15");
    form.elements.horaInicio.value = "10:15";
    form.elements.especialidade.value = "222222222222222222222222";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 30));
    const body = JSON.parse(
      requests.find((r) => r.url === "/api/auth/register").options.body,
    );
    assert.deepEqual(body.horarioDisponivel, {
      diasSemana: ["segunda", "terça"],
      horaInicio: "10:15",
      horaFim: "16:45",
    });
    assert.deepEqual(errors, []);
  } finally {
    dom.window.close();
  }
});

test("gestão permite expediente individual e padrão para todos", async () => {
  const { dom, w, requests, errors } = await setup(
    "profissionais/profissionais.js",
    "admin",
    ["assets/horarios.js"],
  );
  try {
    const preset = w.document.getElementById("preset");
    w.document.getElementById("aplicarTodos").checked = true;
    preset.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 20));
    const req = requests.find(
      (r) =>
        r.url === "/api/medicos/horario-padrao" && r.options?.method === "PUT",
    );
    assert.equal(JSON.parse(req.options.body).aplicarTodos, true);
    const form = w.document.querySelector(".doctor-schedule");
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(
      requests.some(
        (r) =>
          r.url.endsWith("/333333333333333333333333/horario") &&
          r.options.method === "PUT",
      ),
    );
    assert.deepEqual(errors, []);
  } finally {
    dom.window.close();
  }
});

test("admin busca paciente por CPF e envia o paciente selecionado no agendamento", async () => {
  const { dom, w, requests, errors } = await setup(
    "agendamento/agendamento.js",
    "admin",
  );
  try {
    const form = w.document.getElementById("booking");
    const search = w.document.getElementById("busca-paciente");
    search.value = "123.456.789-00";
    search.dispatchEvent(new w.Event("input"));
    assert.equal(form.elements.paciente.options.length, 2);
    assert.match(form.elements.paciente.options[1].textContent, /Ana Silva/);
    form.elements.paciente.value = "777777777777777777777777";
    form.elements.medico.value = "333333333333333333333333";
    form.elements.data.value = "2026-11-10";
    form.elements.data.dispatchEvent(new w.Event("change"));
    await new Promise((r) => setTimeout(r, 20));
    form.elements.hora.value = "09:00";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 20));
    const request = requests.find(
      (r) => r.url === "/api/agendamentos" && r.options?.method === "POST",
    );
    assert.equal(
      JSON.parse(request.options.body).paciente,
      "777777777777777777777777",
    );
    assert.deepEqual(errors, []);
  } finally {
    dom.window.close();
  }
});
