const { spawnSync, spawn } = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");

const root = path.join(__dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function dependenciesReady() {
  try {
    require.resolve("nodemon/bin/nodemon.js", { paths: [root] });
    require.resolve("mongoose", { paths: [root] });
    require.resolve("dotenv", { paths: [root] });
    require.resolve("mongodb-memory-server", { paths: [root] });
    return true;
  } catch {
    return false;
  }
}

function run() {
  if (!dependenciesReady()) {
    console.log("Instalando as dependências do projeto (npm ci)...");
    const result = spawnSync(npm, ["ci"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    if (!dependenciesReady())
      throw new Error("As dependências ainda estão ausentes após npm ci.");
  }

  require("../backend/config/env");
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "npm run dev é apenas para desenvolvimento. Use npm start em produção.",
    );

  const env = {
    ...process.env,
    NODE_ENV: "development",
    HOST: process.env.HOST || "127.0.0.1",
    DEV_AUTO_PREPARE_DB: "true",
  };
  if (!env.MONGODB_URI) {
    if (env.USE_MEMORY_DB === "false")
      throw new Error(
        "Configure MONGODB_URI no backend/.env ou permita o banco temporário com USE_MEMORY_DB=true.",
      );
    env.USE_MEMORY_DB = "true";
    console.warn(
      "Sem MONGODB_URI: usando banco temporário. Os dados serão perdidos ao encerrar.",
    );
  }
  if (!env.JWT_SECRET) env.JWT_SECRET = crypto.randomBytes(48).toString("hex");

  const nodemon = require.resolve("nodemon/bin/nodemon.js", { paths: [root] });
  const child = spawn(process.execPath, [nodemon, "backend/server.js"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => child.kill(signal));
  child.once("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    process.exitCode = code || 0;
  });
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
