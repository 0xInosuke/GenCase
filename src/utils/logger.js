const fs = require("fs");
const path = require("path");

const logsDir = path.join(process.cwd(), "logs");
const accessLogPath = path.join(logsDir, "access.log");
const errorLogPath = path.join(logsDir, "error.log");
const aiLogPath = path.join(logsDir, "ai.log");

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function appendLine(filePath, line) {
  ensureLogsDir();
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

function formatTimestamp(value = new Date()) {
  return value.toISOString();
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || "-";
}

function getActor(req) {
  if (req.sessionUser?.user_name) {
    return req.sessionUser.user_name;
  }

  if (req.apiClient?.api_key_name) {
    return req.apiClient.api_key_name;
  }

  if (req.originalUrl === "/api/auth/login" && req.body?.user_name) {
    return `login:${String(req.body.user_name).trim() || "anonymous"}`;
  }

  return "anonymous";
}

function logAccess(req, { statusCode, durationMs }) {
  const line = `[access] time=${formatTimestamp()} ip=${getRequestIp(req)} actor=${getActor(req)} method=${req.method} path=${req.originalUrl} status=${statusCode} duration_ms=${durationMs}`;
  console.log(line);
  appendLine(accessLogPath, line);
}

function logError(req, { statusCode, details }) {
  const line = `[error] time=${formatTimestamp()} ip=${getRequestIp(req)} actor=${getActor(req)} method=${req.method} path=${req.originalUrl} status=${statusCode}`;
  console.error(`${line}\n${details}`);
  appendLine(errorLogPath, `${line}\n${details}\n`);
}

function logStartup(message) {
  const line = `[startup] time=${formatTimestamp()} ${message}`;
  console.log(line);
  appendLine(accessLogPath, line);
}

function logAiEvent(req, message, details = null) {
  const line = `[ai] time=${formatTimestamp()} ip=${getRequestIp(req)} actor=${getActor(req)} ${message}`;
  console.log(line);
  appendLine(aiLogPath, details ? `${line}\n${details}\n` : line);
}

module.exports = {
  accessLogPath,
  errorLogPath,
  aiLogPath,
  logAccess,
  logAiEvent,
  logError,
  logStartup
};
