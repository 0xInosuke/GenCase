const caseModel = require("../models/caseModel");
const workflowModel = require("../models/workflowModel");
const { withUserTransaction } = require("../config/database");
const { buildCreateAuditEntries, buildUpdateAuditEntries, createEntries } = require("../services/auditService");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function parseCaseData(value) {
  let data = value;
  if (typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch (_error) {
      fail("case_data must be valid JSON.");
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail("case_data must be a JSON object.");
  }

  return data;
}

function normalizeStageCode(value) {
  const stageCode = String(value || "").trim();
  if (!stageCode) {
    fail("stage_code is required.");
  }
  return stageCode;
}

function normalizeCaseTitle(value) {
  const caseTitle = String(value || "").trim();
  if (!caseTitle) {
    fail("case_title is required.");
  }
  return caseTitle;
}

function getWorkflowStages(workflow) {
  const stages = workflow?.wf_data?.stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    fail("The selected workflow does not define valid stages.");
  }
  return stages.map((stage) => String(stage).trim()).filter(Boolean);
}

function ensureStageInWorkflow(stageCode, workflow) {
  const stages = getWorkflowStages(workflow);
  if (!stages.includes(stageCode)) {
    fail("stage_code must be one of the stages defined in the workflow.");
  }
}

function parseCreatePayload(body) {
  const workflowId = Number(body.workflow_id);
  if (!Number.isInteger(workflowId) || workflowId <= 0) {
    fail("workflow_id must be a positive integer.");
  }

  return {
    workflow_id: workflowId,
    case_title: normalizeCaseTitle(body.case_title),
    stage_code: normalizeStageCode(body.stage_code),
    case_data: parseCaseData(body.case_data)
  };
}

function parseUpdatePayload(body) {
  return {
    case_title: normalizeCaseTitle(body.case_title),
    stage_code: normalizeStageCode(body.stage_code),
    case_data: parseCaseData(body.case_data)
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(query.sort_by, query.sort_dir, ["id", "workflow_id", "wf_name", "case_title", "stage_code", "created_at"], "id");
  const rawSearch = String(query.search || "").trim();
  let jsonSearch = null;
  let textSearch = rawSearch || null;

  if (rawSearch.startsWith("{")) {
    try {
      jsonSearch = JSON.parse(rawSearch);
    } catch (_error) {
      fail("search must be valid JSON when using JSON condition search.");
    }

    if (!jsonSearch || typeof jsonSearch !== "object" || Array.isArray(jsonSearch)) {
      fail("JSON condition search must be a JSON object.");
    }

    textSearch = null;
  }

  return {
    search: textSearch,
    jsonSearch,
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir
  };
}

module.exports = {
  async list(req, res, next) {
    try {
      res.json(await caseModel.listCasesForApiKey(parseListOptions(req.query), req.apiClient.api_key_name));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await caseModel.getCaseByIdForApiKey(Number(req.params.id), req.apiClient.api_key_name);
      if (!item) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = parseCreatePayload(req.body);
      const workflow = await workflowModel.getWorkflowById(payload.workflow_id);
      if (!workflow) {
        return res.status(400).json({ error: "workflow_id does not reference an existing workflow." });
      }
      if (workflow.status_code !== "ACT") {
        return res.status(400).json({ error: "Only active workflows can be used when creating cases." });
      }
      ensureStageInWorkflow(payload.stage_code, workflow);

      const canAccess = await caseModel.canApiKeyAccessWorkflowStage(
        req.apiClient.api_key_name,
        payload.workflow_id,
        payload.stage_code
      );
      if (!canAccess) {
        return res.status(403).json({ error: "This API key does not have access to create a case at this stage." });
      }

      const created = await withUserTransaction(async (queryFn) => {
        const nextCase = await caseModel.createCaseForApiKey(payload, req.apiClient.api_key_name, queryFn);
        const auditEntries = buildCreateAuditEntries({
          userId: req.apiClient.api_key_name,
          targetId: nextCase.id,
          targetType: "case",
          record: nextCase,
          statusField: "stage_code",
          statusChangeType: "STATUS_CHANGE",
          dataFields: ["case_title", "case_data"]
        });
        await createEntries(auditEntries, queryFn);
        return nextCase;
      });

      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const caseId = Number(req.params.id);
      const existingCase = await caseModel.getCaseByIdForApiKey(caseId, req.apiClient.api_key_name);
      if (!existingCase) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      const payload = parseUpdatePayload(req.body);
      const workflow = await workflowModel.getWorkflowById(existingCase.workflow_id);
      if (!workflow) {
        return res.status(400).json({ error: "The linked workflow no longer exists." });
      }
      ensureStageInWorkflow(payload.stage_code, workflow);

      const canAccess = await caseModel.canApiKeyAccessWorkflowStage(
        req.apiClient.api_key_name,
        existingCase.workflow_id,
        payload.stage_code
      );
      if (!canAccess) {
        return res.status(403).json({ error: "This API key does not have access to set this stage." });
      }

      const updated = await withUserTransaction(async (queryFn) => {
        const nextCase = await caseModel.updateCaseForApiKey(caseId, payload, req.apiClient.api_key_name, queryFn);
        const auditEntries = buildUpdateAuditEntries({
          userId: req.apiClient.api_key_name,
          targetId: caseId,
          targetType: "case",
          previousRecord: existingCase,
          nextRecord: nextCase,
          statusField: "stage_code",
          statusChangeType: "STATUS_CHANGE",
          dataFields: ["case_title", "case_data"]
        });
        await createEntries(auditEntries, queryFn);
        return nextCase;
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
};
