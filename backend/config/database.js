require("./env");
const mongoose = require("mongoose");
let memoryServer;
async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.USE_MEMORY_DB !== "true"
    ) {
      throw new Error(
        "Defina MONGODB_URI. Banco temporário exige USE_MEMORY_DB=true fora de produção.",
      );
    }
    const { MongoMemoryReplSet } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = memoryServer.getUri();
    console.warn("Banco temporário: os dados serão perdidos ao encerrar.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
  });
  console.log("MongoDB conectado.");
  return mongoose.connection;
}
async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
