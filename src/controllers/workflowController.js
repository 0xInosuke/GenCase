const workflowModel = require("../models/workflowModel");
const { STATUS_CODES } = require("../constants/statusCodes");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function parseWorkflowData(value) {
  let data = value;
  if (typeof value === "string") {
    try {
      data = JSON.parse(value);
    } catch (_error) {
      fail("wf_data must be valid JSON.");
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail("wf_data must be a JSON object.");
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const stages = Array.isArray(data.stages) ? data.stages : null;
  const access = data.access;

  if (!name) {
    fail("wf_data.name is required and must be a non-empty string.");
  }

  if (!description) {
    fail("wf_data.description is required and must be a non-empty string.");
  }

  if (!stages || stages.length === 0) {
    fail("wf_data.stages must be a non-empty array.");
  }

  const normalizedStages = stages.map((stage) => {
    const stageName = typeof stage === "string" ? stage.trim() : "";
    if (!stageName) {
      fail("wf_data.stages must contain non-empty string values.");
    }
    return stageName;
  });

  if (new Set(normalizedStages).size !== normalizedStages.length) {
    fail("wf_data.stages cannot contain duplicate stage names.");
  }

  if (!access || typeof access !== "object" || Array.isArray(access)) {
    fail("wf_data.access must be an object.");
  }

  for (const stageName of normalizedStages) {
    const allowedGroups = access[stageName];
    if (!Array.isArray(allowedGroups) || allowedGroups.length === 0) {
      fail(`wf_data.access.${stageName} must be a non-empty array of user groups.`);
    }

    for (const groupName of allowedGroups) {
      const normalizedGroup = typeof groupName === "string" ? groupName.trim() : "";
      if (!normalizedGroup) {
        fail(`wf_data.access.${stageName} must only contain non-empty strings.`);
      }
    }
  }

  const accessKeys = Object.keys(access);
  for (const key of accessKeys) {
    if (!normalizedStages.includes(key)) {
      fail(`wf_data.access contains unknown stage key: ${key}.`);
    }
  }

  return {
    name,
    description,
    stages: normalizedStages,
    access: Object.fromEntries(
      normalizedStages.map((stageName) => [
        stageName,
        Array.from(new Set(access[stageName].map((groupName) => groupName.trim())))
      ])
    )
  };
}

function parseWorkflowPayload(body) {
  const wfName = String(body.wf_name || "").trim();
  const statusCode = String(body.status_code || "").trim().toUpperCase();
  const wfData = parseWorkflowData(body.wf_data);

  if (!wfName) {
    fail("wf_name is required.");
  }

  if (!STATUS_CODES.includes(statusCode)) {
    fail(`status_code must be one of: ${STATUS_CODES.join(", ")}`);
  }

  return {
    wf_name: wfName,
    status_code: statusCode,
    wf_data: wfData
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(query.sort_by, query.sort_dir, ["id", "wf_name", "status_code", "created_at"], "id");

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
      res.json(await workflowModel.listWorkflows(parseListOptions(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await workflowModel.getWorkflowById(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const created = await workflowModel.createWorkflow(parseWorkflowPayload(req.body));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await workflowModel.updateWorkflow(Number(req.params.id), parseWorkflowPayload(req.body));
      if (!updated) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await workflowModel.deleteWorkflow(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

