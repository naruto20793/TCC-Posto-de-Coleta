const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
// Também aceita .env na raiz, sem sobrescrever valores do ambiente/backend.
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
