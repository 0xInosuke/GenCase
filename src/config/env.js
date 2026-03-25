const fs = require("fs");
const path = require("path");

let cachedConfig;

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
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

module.exports = {
  getAppConfig
};
