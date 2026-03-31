const { getAiConfig } = require("../config/env");
const caseModel = require("../models/caseModel");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");
const { interpretCaseSearchPrompt, validatePlan } = require("../services/aiProviderService");
const { runCaseSearchForUser, runCaseSearchOnCases, buildSearchContextFromCases } = require("../services/aiCaseSearchService");

const aiRequestBuckets = new Map();

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function enforceAiRateLimit(userId) {
  const config = getAiConfig();
  const now = Date.now();
  const existingTimestamps = aiRequestBuckets.get(userId) || [];
  const recentTimestamps = existingTimestamps.filter((timestamp) => now - timestamp < config.rateLimitWindowMs);

  if (recentTimestamps.length >= config.rateLimitMaxRequests) {
    fail("AI search rate limit exceeded. Please wait and try again.", 429);
  }

  recentTimestamps.push(now);
  aiRequestBuckets.set(userId, recentTimestamps);
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
      let result = null;

      if (prompt) {
        if (prompt.length > 1000) {
          fail("AI search prompt is too long. Keep it under 1000 characters.");
        }

        enforceAiRateLimit(req.sessionUser.user_id);
        const visibleCases = await caseModel.listAllCasesForAi(req.sessionUser.user_id);
        const searchContext = buildSearchContextFromCases(visibleCases);
        const interpreted = await interpretCaseSearchPrompt(prompt, searchContext);
        explanation = interpreted.explanation;
        plan = interpreted.plan;
        result = runCaseSearchOnCases(visibleCases, plan, options);

        if (result.pagination.total_count === 0 && searchContext.jsonPaths.length > 0) {
          const retry = await interpretCaseSearchPrompt(prompt, {
            ...searchContext,
            zeroResultRetry: true,
            previousPlan: plan
          });
          const retryResult = runCaseSearchOnCases(visibleCases, retry.plan, options);
          if (retryResult.pagination.total_count > 0) {
            explanation = retry.explanation || explanation;
            plan = retry.plan;
            result = retryResult;
          }
        }
      } else if (req.body?.plan) {
        plan = validatePlan(req.body.plan);
        explanation = String(req.body?.explanation || "").trim();
        result = await runCaseSearchForUser(req.sessionUser.user_id, plan, options);
      } else {
        fail("Either prompt or plan is required.");
      }

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
