const fs = require("fs");
const path = require("path");

let cachedKeys;

function loadApiKeys() {
  if (cachedKeys) {
    return cachedKeys;
  }

  const configPath = path.join(process.cwd(), "api_keys.env");
  const keys = new Map();

  if (!fs.existsSync(configPath)) {
    cachedKeys = keys;
    return keys;
  }

  const lines = fs.readFileSync(configPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (name && value) {
      keys.set(value, name);
    }
  }

  cachedKeys = keys;
  return keys;
}

function getApiKeyName(rawKey) {
  if (!rawKey) {
    return null;
  }

  return loadApiKeys().get(String(rawKey).trim()) || null;
}

module.exports = {
  getApiKeyName
};
