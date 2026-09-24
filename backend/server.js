require("./config/env");
const connectDB = require("./config/database");
const app = require("./app");
async function start() {
  await connectDB();
  if (process.env.USE_MEMORY_DB === "true" && !process.env.MONGODB_URI)
    await require("./scripts/database-maintenance").indexes();
  await require("./services/database-readiness")();
  const server = app.listen(process.env.PORT || 5000, () =>
    console.log("Servidor iniciado."),
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
