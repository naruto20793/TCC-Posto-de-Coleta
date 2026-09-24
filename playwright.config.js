const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5081", headless: true },
  webServer: {
    command: "node tests/frontend-server.js",
    url: "http://127.0.0.1:5081/login/login.html",
    reuseExistingServer: !process.env.CI,
  },
});
