require("./config/env");
const connectDB = require("./config/database");
const app = require("./app");
async function start() {
  await connectDB();
  if (
    (process.env.NODE_ENV !== "production" &&
      process.env.DEV_AUTO_PREPARE_DB === "true") ||
    (process.env.USE_MEMORY_DB === "true" && !process.env.MONGODB_URI)
  )
    await require("./scripts/database-maintenance").indexes();
  await require("./services/database-readiness")();
  const port = process.env.PORT || 5000;
  const host = process.env.HOST || "0.0.0.0";
  const server = app.listen(port, host, () =>
    console.log(`Servidor iniciado em http://${host}:${port}/`),
  );
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_PUBLIC_TEST_REGISTRATION !== "false"
  )
    console.warn(
      "Cadastro público de TESTE ativo: visitantes podem criar super admins.",
    );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      server.close(async () => {
        await connectDB.disconnectDB();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
}
if (require.main === module)
  start().catch((error) => {
    console.error(error.message);
    connectDB.disconnectDB().finally(() => {
      process.exitCode = 1;
    });
  });
module.exports = { start };
