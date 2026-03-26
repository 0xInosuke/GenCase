const crypto = require("node:crypto");

const SESSION_COOKIE_NAME = "gencase_session";
const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    user_id: user.id,
    user_name: user.user_name,
    display_name: user.display_name
  });
  return token;
}

function getSession(token) {
  if (!token) {
    return null;
  }
  return sessions.get(token) || null;
}

function clearSession(token) {
  if (!token) {
    return;
  }
  sessions.delete(token);
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSession,
  getSession,
  clearSession
};

