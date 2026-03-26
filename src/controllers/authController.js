const userModel = require("../models/userModel");
const caseModel = require("../models/caseModel");
const { SESSION_COOKIE_NAME, createSession, clearSession } = require("../auth/sessionStore");
const { getRequestSession } = require("../middleware/auth");

function buildCookie(token) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;
}

function buildExpiredCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

module.exports = {
  async login(req, res, next) {
    try {
      const userName = String(req.body.user_name || "").trim();
      const userPassword = String(req.body.user_password || "").trim();

      if (!userName || !userPassword) {
        return res.status(400).json({ error: "user_name and user_password are required." });
      }

      const user = await userModel.getUserForLogin(userName, userPassword);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const token = createSession(user);
      const visibleCaseCount = await caseModel.countVisibleCases(user.id);
      res.setHeader("Set-Cookie", buildCookie(token));
      return res.json({
        id: user.id,
        user_name: user.user_name,
        display_name: user.display_name,
        visible_case_count: visibleCaseCount
      });
    } catch (error) {
      return next(error);
    }
  },

  me(req, res) {
    const { session } = getRequestSession(req);
    if (!session) {
      return res.status(401).json({ error: "Authentication required." });
    }

    return res.json(session);
  },

  logout(req, res) {
    const { token } = getRequestSession(req);
    clearSession(token);
    res.setHeader("Set-Cookie", buildExpiredCookie());
    return res.status(204).send();
  }
};
