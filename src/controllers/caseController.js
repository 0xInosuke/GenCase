const caseModel = require("../models/caseModel");
const workflowModel = require("../models/workflowModel");
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
    stage_code: normalizeStageCode(body.stage_code),
    case_data: parseCaseData(body.case_data)
  };
}

function parseUpdatePayload(body) {
  return {
    stage_code: normalizeStageCode(body.stage_code),
    case_data: parseCaseData(body.case_data)
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(
    query.sort_by,
    query.sort_dir,
    ["id", "workflow_id", "wf_name", "stage_code", "created_at"],
    "id"
  );

  return {
    search: String(query.search || "").trim() || null,
    page,
    pageSize,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir
  };
}

module.exports = {
  async list(req, res, next) {
    try {
      res.json(await caseModel.listCases(parseListOptions(req.query), req.sessionUser.user_id));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await caseModel.getCaseByIdForUser(Number(req.params.id), req.sessionUser.user_id);
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
      const canAccess = await caseModel.canUserAccessWorkflowStage(
        req.sessionUser.user_id,
        payload.workflow_id,
        payload.stage_code
      );
      if (!canAccess) {
        return res.status(403).json({ error: "You do not have access to create a case at this stage." });
      }

      const created = await caseModel.createCase(payload, req.sessionUser.user_id);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const caseId = Number(req.params.id);
      const existingCase = await caseModel.getCaseByIdForUser(caseId, req.sessionUser.user_id);
      if (!existingCase) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      const payload = parseUpdatePayload(req.body);
      const workflow = await workflowModel.getWorkflowById(existingCase.workflow_id);
      if (!workflow) {
        return res.status(400).json({ error: "The linked workflow no longer exists." });
      }

      ensureStageInWorkflow(payload.stage_code, workflow);
      const canAccess = await caseModel.canUserAccessWorkflowStage(
        req.sessionUser.user_id,
        existingCase.workflow_id,
        payload.stage_code
      );
      if (!canAccess) {
        return res.status(403).json({ error: "You do not have access to set this stage." });
      }

      const updated = await caseModel.updateCase(caseId, payload, req.sessionUser.user_id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const caseId = Number(req.params.id);
      const existingCase = await caseModel.getCaseByIdForUser(caseId, req.sessionUser.user_id);
      if (!existingCase) {
        return res.status(403).json({ error: "You do not have access to this case." });
      }

      const deleted = await caseModel.deleteCase(caseId);
      if (!deleted) {
        return res.status(404).json({ error: "Case not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
