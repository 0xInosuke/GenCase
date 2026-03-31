const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");
const { interpretCaseSearchPrompt, validatePlan } = require("../services/aiProviderService");
const { runCaseSearchForUser } = require("../services/aiCaseSearchService");

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function parseListOptions(body) {
  const page = parsePositiveInteger(body.page, 1);
  const pageSize = clampPageSize(body.page_size);
  const sort = normalizeSort(
    body.sort_by,
    body.sort_dir,
    ["id", "workflow_id", "wf_name", "case_title", "stage_code", "last_edited_by", "last_edited_at", "created_at"],
    "id"
  );

  return {
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir
  };
}

module.exports = {
  async runCaseSearch(req, res, next) {
    try {
      const options = parseListOptions(req.body || {});
      const prompt = String(req.body?.prompt || "").trim();
      let explanation = "";
      let plan = null;

      if (prompt) {
        const interpreted = await interpretCaseSearchPrompt(prompt);
        explanation = interpreted.explanation;
        plan = interpreted.plan;
      } else if (req.body?.plan) {
        plan = validatePlan(req.body.plan);
        explanation = String(req.body?.explanation || "").trim();
      } else {
        fail("Either prompt or plan is required.");
      }

      const result = await runCaseSearchForUser(req.sessionUser.user_id, plan, options);
      res.json({
        ...result,
        ai: {
          prompt,
          explanation,
          plan
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
