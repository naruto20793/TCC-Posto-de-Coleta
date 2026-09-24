// Servidor exclusivo dos testes de interface; as respostas da API são simuladas pelo Playwright.
require("../backend/app").listen(5081, "127.0.0.1");
