const fs = require("fs");
const path = require("path");
const { getAiConfig } = require("../config/env");
const caseModel = require("../models/caseModel");
const groupModel = require("../models/groupModel");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");
const {
  interpretCaseSearchPrompt,
  interpretSemanticIntentPrompt,
  interpretSemanticCaseSearchPrompt,
  validatePlan,
  designWorkflowFromConversation
} = require("../services/aiProviderService");
const { runCaseSearchForUser, runCaseSearchOnCases, buildSearchContextFromCases } = require("../services/aiCaseSearchService");
const { buildSemanticSearchContextFromCases } = require("../services/aiSemanticCaseSearchService");
const { parseWorkflowPayload } = require("../services/workflowValidationService");
const { logAiEvent } = require("../utils/logger");

const aiRequestBuckets = new Map();
let workflowGuideCache = null;

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

function readWorkflowGuide() {
  if (workflowGuideCache) {
    return workflowGuideCache;
  }

  const guidePath = path.join(process.cwd(), "WORKFLOW.md");
  workflowGuideCache = fs.readFileSync(guidePath, "utf8");
  return workflowGuideCache;
}

function parseWorkflowConversation(body) {
  const rawConversation = Array.isArray(body?.conversation) ? body.conversation : [];
  const normalized = [];

  for (const item of rawConversation) {
    const role = String(item?.role || "").trim().toLowerCase();
    const content = String(item?.content || "").trim();

    if (!["user", "assistant"].includes(role) || !content) {
      continue;
    }

    normalized.push({
      role,
      content: content.slice(0, 2000)
    });
  }

  return normalized.slice(-12);
}

function parseWorkflowDraft(body) {
  const draft = body?.draft;
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return null;
  }

  const normalized = {};

  if (typeof draft.wf_name === "string") {
    normalized.wf_name = draft.wf_name.trim();
  }

  if (typeof draft.status_code === "string") {
    normalized.status_code = draft.status_code.trim().toUpperCase();
  }

  if (typeof draft.wf_data === "string") {
    try {
      normalized.wf_data = JSON.parse(draft.wf_data);
    } catch (_error) {
      normalized.wf_data = null;
    }
  } else if (draft.wf_data && typeof draft.wf_data === "object" && !Array.isArray(draft.wf_data)) {
    normalized.wf_data = draft.wf_data;
  }

  return normalized;
}

module.exports = {
  getStatus(_req, res, next) {
    try {
      const aiConfig = getAiConfig();
      res.json({
        enabled: true,
        semantic_filter_enabled: aiConfig.semanticFilterEnabled,
        candidate_limit: aiConfig.semanticCandidateLimit,
        model: aiConfig.model
      });
    } catch (error) {
      if (error.statusCode === 503) {
        return res.json({
          enabled: false,
          semantic_filter_enabled: false,
          candidate_limit: 0,
          model: ""
        });
      }
      return next(error);
    }
  },

  async runCaseSearch(req, res, next) {
    try {
      const options = parseListOptions(req.body || {});
      const prompt = String(req.body?.prompt || "").trim();
      let explanation = "";
      let plan = null;
      let result = null;
      let mode = "plan";
      let semantic = null;
      const aiConfig = getAiConfig();

      if (prompt) {
        if (prompt.length > 1000) {
          fail("AI search prompt is too long. Keep it under 1000 characters.");
        }

        enforceAiRateLimit(req.sessionUser.user_id);
        const visibleCases = await caseModel.listAllCasesForAi(req.sessionUser.user_id);
        logAiEvent(req, `prompt_received visible_cases=${visibleCases.length} semantic_enabled=${aiConfig.semanticFilterEnabled}`, prompt);

        if (aiConfig.semanticFilterEnabled) {
          const intent = await interpretSemanticIntentPrompt(prompt);
          logAiEvent(req, `semantic_intent summary="${intent.summary}" signals=${intent.signals.length}`);

          const semanticPassLimits = Array.from(new Set([
            aiConfig.semanticCandidateLimit,
            Math.min(Math.max(aiConfig.semanticCandidateLimit * 2, aiConfig.semanticCandidateLimit), visibleCases.length),
            visibleCases.length
          ])).filter((limit) => limit > 0);

          for (const candidateLimit of semanticPassLimits) {
            const semanticContext = buildSemanticSearchContextFromCases(
              visibleCases,
              req.sessionUser.user_id,
              `${prompt} ${intent.summary} ${intent.signals.join(" ")}`.trim(),
              candidateLimit
            );
            logAiEvent(
              req,
              `semantic_pass candidate_limit=${candidateLimit} candidate_count=${semanticContext.candidates.length} fingerprint=${semanticContext.fingerprint}`
            );

            const interpretedSemantic = await interpretSemanticCaseSearchPrompt(prompt, {
              visibleCaseCount: visibleCases.length,
              candidates: semanticContext.candidates,
              intent
            });
            const matchedIdSet = new Set(interpretedSemantic.matchedCaseIds);
            const semanticItems = visibleCases
              .filter((item) => matchedIdSet.has(Number(item.id)))
              .sort((left, right) => {
                const leftIndex = interpretedSemantic.matchedCaseIds.indexOf(Number(left.id));
                const rightIndex = interpretedSemantic.matchedCaseIds.indexOf(Number(right.id));
                if (leftIndex !== rightIndex) {
                  return leftIndex - rightIndex;
                }
                return Number(left.id) - Number(right.id);
              });

            logAiEvent(req, `semantic_result matched=${semanticItems.length} candidate_count=${semanticContext.candidates.length}`);

            if (semanticItems.length > 0) {
              const totalCount = semanticItems.length;
              const totalPages = Math.ceil(totalCount / options.pageSize);
              const offset = (options.page - 1) * options.pageSize;
              result = {
                items: semanticItems.slice(offset, offset + options.pageSize),
                pagination: {
                  page: options.page,
                  page_size: options.pageSize,
                  total_pages: totalPages,
                  total_count: totalCount
                }
              };
              explanation = interpretedSemantic.explanation;
              mode = "semantic";
              semantic = {
                intent,
                matched_case_ids: interpretedSemantic.matchedCaseIds,
                candidate_count: semanticContext.candidates.length,
                snapshot_fingerprint: semanticContext.fingerprint,
                pass_candidate_limit: candidateLimit
              };
              break;
            }
          }
        }

        if (!result) {
          logAiEvent(req, "semantic_no_match_fallback_to_plan");
          const searchContext = buildSearchContextFromCases(visibleCases);
          const interpreted = await interpretCaseSearchPrompt(prompt, searchContext);
          explanation = interpreted.explanation;
          plan = interpreted.plan;
          result = runCaseSearchOnCases(visibleCases, plan, options);
          logAiEvent(req, `plan_result matched=${result.pagination.total_count}`);

          if (result.pagination.total_count === 0 && searchContext.jsonPaths.length > 0) {
            const retry = await interpretCaseSearchPrompt(prompt, {
              ...searchContext,
              zeroResultRetry: true,
              previousPlan: plan
            });
            const retryResult = runCaseSearchOnCases(visibleCases, retry.plan, options);
            logAiEvent(req, `plan_retry_result matched=${retryResult.pagination.total_count}`);
            if (retryResult.pagination.total_count > 0) {
              explanation = retry.explanation || explanation;
              plan = retry.plan;
              result = retryResult;
            }
          }
        }
      } else if (req.body?.plan) {
        plan = validatePlan(req.body.plan);
        explanation = String(req.body?.explanation || "").trim();
        result = await runCaseSearchForUser(req.sessionUser.user_id, plan, options);
        mode = "plan";
      } else {
        fail("Either prompt or plan is required.");
      }

      res.json({
        ...result,
        ai: {
          mode,
          prompt,
          explanation,
          plan,
          semantic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async runWorkflowDesign(req, res, next) {
    try {
      const prompt = String(req.body?.prompt || "").trim();
      if (!prompt) {
        fail("prompt is required.");
      }
      if (prompt.length > 2000) {
        fail("Workflow prompt is too long. Keep it under 2000 characters.");
      }

      enforceAiRateLimit(req.sessionUser.user_id);
      const groupsResult = await groupModel.listGroups({
        search: null,
        page: 1,
        pageSize: 200,
        sortBy: "group_name",
        sortDir: "asc"
      });
      const groupNames = groupsResult.items.map((item) => item.group_name);
      const workflowGuide = readWorkflowGuide();
      const conversation = parseWorkflowConversation(req.body);
      const draft = parseWorkflowDraft(req.body);

      logAiEvent(
        req,
        `workflow_prompt_received groups=${groupNames.length} conversation_turns=${conversation.length}`,
        prompt
      );

      const aiResult = await designWorkflowFromConversation({
        prompt,
        conversation,
        draft,
        workflowGuide,
        groupNames
      });
      const workflow = parseWorkflowPayload(aiResult.workflow);

      logAiEvent(req, `workflow_prompt_result wf_name=${workflow.wf_name} stages=${workflow.wf_data.stages.length}`);

      res.json({
        assistant_message: aiResult.assistantMessage || "I generated a workflow draft that matches the required format.",
        workflow
      });
    } catch (error) {
      next(error);
    }
  }
};
