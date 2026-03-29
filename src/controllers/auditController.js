const auditModel = require("../models/auditModel");
const caseModel = require("../models/caseModel");

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function parseTargetId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    fail("target_id must be a positive integer.");
  }
  return id;
}

function parseTargetType(value) {
  const targetType = String(value || "").trim();
  if (!["user", "group", "user_group", "workflow", "case"].includes(targetType)) {
    fail("target_type must be one of: user, group, user_group, workflow, case.");
  }
  return targetType;
}

module.exports = {
  async list(req, res, next) {
    try {
      const targetId = parseTargetId(req.query.target_id);
      const targetType = parseTargetType(req.query.target_type);

      if (targetType === "case") {
        const targetCase = await caseModel.getCaseByIdForUser(targetId, req.sessionUser.user_id);
        if (!targetCase) {
          return res.status(403).json({ error: "You do not have access to this case." });
        }
      }

      res.json(await auditModel.listByTarget(targetType, targetId));
    } catch (error) {
      next(error);
    }
  }
};
