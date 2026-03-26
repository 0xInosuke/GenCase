const commentModel = require("../models/commentModel");
const caseModel = require("../models/caseModel");

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function parseCaseId(raw) {
  const caseId = Number(raw);
  if (!Number.isInteger(caseId) || caseId <= 0) {
    fail("case_id must be a positive integer.");
  }
  return caseId;
}

function parseCreatePayload(body, sessionUserId) {
  const caseId = parseCaseId(body.case_id);
  const content = String(body.content || "").trim();

  if (!content) {
    fail("content is required.");
  }

  return {
    case_id: caseId,
    user_id: sessionUserId,
    content,
    status_code: "ACT"
  };
}

module.exports = {
  async list(req, res, next) {
    try {
      const caseId = parseCaseId(req.query.case_id);
      const targetCase = await caseModel.getCaseByIdForUser(caseId, req.sessionUser.user_id);
      if (!targetCase) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      res.json(await commentModel.listByCaseId(caseId));
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = parseCreatePayload(req.body, req.sessionUser.user_id);
      const targetCase = await caseModel.getCaseByIdForUser(payload.case_id, req.sessionUser.user_id);
      if (!targetCase) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      const created = await commentModel.create(payload);
      const items = await commentModel.listByCaseId(created.case_id);
      const withDisplayName = items.find((item) => String(item.id) === String(created.id));
      res.status(201).json(withDisplayName || created);
    } catch (error) {
      next(error);
    }
  }
};

