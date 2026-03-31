const fs = require("fs");
const path = require("path");

let cachedConfig;
let envLoaded = false;

function loadEnvFile() {
  if (envLoaded) {
    return;
  }

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  // Keep parsing simple so the app can run without an extra dotenv dependency.
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  envLoaded = true;
}

function requireValue(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildConnectionConfig(userKey, passwordKey) {
  const sslEnabled = process.env.DB_SSL === "true";

  return {
    host: requireValue("DB_HOST"),
    port: Number(requireValue("DB_PORT")),
    database: requireValue("DB_NAME"),
    user: requireValue(userKey),
    password: requireValue(passwordKey),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false
  };
}

function getAppConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  loadEnvFile();

  cachedConfig = {
    port: Number(process.env.PORT || 3000),
    adminDb: buildConnectionConfig("DB_ADMIN_USER", "DB_ADMIN_PASSWORD"),
    userDb: buildConnectionConfig("DB_APP_USER", "DB_APP_PASSWORD")
  };

  return cachedConfig;
}

function getAiConfig() {
  loadEnvFile();

  const apiUrl = String(process.env.AI_API_URL || "").trim();
  const apiKey = String(process.env.AI_API_KEY || "").trim();
  const model = String(process.env.AI_MODEL || "").trim();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 20000);
  const rateLimitWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60000);
  const rateLimitMaxRequests = Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS || 20);
  const semanticFilterEnabled = String(process.env.AI_SEMANTIC_FILTER_ENABLED || "false").trim().toLowerCase() === "true";
  const semanticCandidateLimit = Number(process.env.AI_SEMANTIC_CANDIDATE_LIMIT || 120);

  if (!apiUrl || !apiKey || !model) {
    const error = new Error("AI search is not configured. Set AI_API_URL, AI_API_KEY, and AI_MODEL in .env.");
    error.statusCode = 503;
    throw error;
  }

  return {
    apiUrl,
    apiKey,
    model,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000,
    rateLimitWindowMs: Number.isFinite(rateLimitWindowMs) && rateLimitWindowMs > 0 ? rateLimitWindowMs : 60000,
    rateLimitMaxRequests: Number.isFinite(rateLimitMaxRequests) && rateLimitMaxRequests > 0 ? rateLimitMaxRequests : 20,
    semanticFilterEnabled,
    semanticCandidateLimit: Number.isFinite(semanticCandidateLimit) && semanticCandidateLimit > 0
      ? semanticCandidateLimit
      : 120
  };
}

module.exports = {
  getAppConfig,
  getAiConfig
};
