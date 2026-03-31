const { SESSION_COOKIE_NAME, getSession } = require("../auth/sessionStore");
const { getApiKeyName } = require("../config/apiKeys");

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  const parts = cookieHeader.split(";");
  const cookies = {};
  for (const part of parts) {
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function getRequestSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  const session = getSession(token);

  if (session) {
    req.sessionUser = session;
  }

  return {
    token,
    session
  };
}

function requireApiAuth(req, res, next) {
  const { session } = getRequestSession(req);
  if (!session) {
    return res.status(401).json({ error: "Authentication required." });
  }

  return next();
}

function requirePageAuth(req, res, next) {
  const { session } = getRequestSession(req);
  if (!session) {
    const nextPath = encodeURIComponent(req.originalUrl || "/");
    return res.redirect(`/login?next=${nextPath}`);
  }

  return next();
}

function requireExternalApiKey(req, res, next) {
  const rawKey = req.headers["x-api-key"];
  const keyName = getApiKeyName(rawKey);
  if (!keyName) {
    return res.status(401).json({ error: "Valid x-api-key is required." });
  }

  req.apiClient = {
    api_key_name: keyName
  };

  return next();
}

module.exports = {
  parseCookies,
  getRequestSession,
  requireApiAuth,
  requirePageAuth,
  requireExternalApiKey
};

