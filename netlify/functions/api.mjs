import serverless from "serverless-http";

let initialization;
async function initialize() {
  // Configure before loading Express/security modules. Never bundle credentials.
  for (const key of ["MONGODB_URI", "JWT_SECRET", "CRYPTO_KEY", "FRONTEND_URL"]) {
    const value = globalThis.Netlify?.env.get(key) ?? process.env[key];
    if (value) process.env[key] = value;
  }
  process.env.NODE_ENV = "production";
  process.env.USE_MEMORY_DB = "false";
  process.env.ALLOW_PUBLIC_TEST_REGISTRATION = "false";
  const { default: crypto } = await import("../../backend/utils/criptografia.js");
  crypto.chave();
  const { default: connectDB } = await import("../../backend/config/database.js");
  // Low-volume TCC: every serverless instance has its own pool. Reuse it warm,
  // cap at five connections and release idle sockets without disconnecting per request.
  await connectDB({ maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 30000 });
  const { default: ready } = await import("../../backend/services/database-readiness.js");
  await ready();
  const { default: app } = await import("../../backend/app.js");
  return serverless(app);
}

export default async function handler(request, context) {
  try {
    initialization ??= initialize().catch((error) => {
      initialization = undefined;
      throw error;
    });
    const adapter = await initialization;
    const url = new URL(request.url);
    const event = {
      version: "2.0",
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: Object.fromEntries(request.headers),
      body: ["GET", "HEAD"].includes(request.method) ? "" : await request.text(),
      isBase64Encoded: false,
      requestContext: {
        requestId: context.requestId,
        http: { method: request.method, sourceIp: context.ip },
      },
    };
    const result = await adapter(event, context);
    const headers = new Headers(result.headers);
    for (const [key, values] of Object.entries(result.multiValueHeaders || {}))
      for (const value of values) headers.append(key, value);
    for (const cookie of result.cookies || []) headers.append("set-cookie", cookie);
    headers.set("cache-control", "no-store");
    const body = result.isBase64Encoded
      ? Buffer.from(result.body, "base64")
      : result.body;
    return new Response(
      request.method === "HEAD" || [204, 304].includes(result.statusCode) ? null : body,
      { status: result.statusCode, headers },
    );
  } catch {
    // Do not disclose database credentials or connection errors to visitors.
    console.error("API initialization/request failed; verify runtime configuration and database readiness.");
    return Response.json(
      { error: "Serviço temporariamente indisponível. Tente novamente." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

export const config = { path: "/api/*" };
