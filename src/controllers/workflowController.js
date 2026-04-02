const workflowModel = require("../models/workflowModel");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");
const { withUserTransaction } = require("../config/database");
const { buildCreateAuditEntries, buildDeleteAuditEntry, buildUpdateAuditEntries, createEntries } = require("../services/auditService");
const { parseWorkflowPayload } = require("../services/workflowValidationService");

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
      const payload = parseWorkflowPayload(req.body);
      const created = await withUserTransaction(async (queryFn) => {
        const nextWorkflow = await workflowModel.createWorkflow(payload, queryFn);
        const auditEntries = buildCreateAuditEntries({
          userId: req.sessionUser.user_id,
          targetId: nextWorkflow.id,
          targetType: "workflow",
          record: nextWorkflow,
          dataFields: ["wf_name", "wf_data"]
        });
        await createEntries(auditEntries, queryFn);
        return nextWorkflow;
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const workflowId = Number(req.params.id);
      const payload = parseWorkflowPayload(req.body);
      const existingWorkflow = await workflowModel.getWorkflowById(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      const updated = await withUserTransaction(async (queryFn) => {
        const nextWorkflow = await workflowModel.updateWorkflow(workflowId, payload, queryFn);
        const auditEntries = buildUpdateAuditEntries({
          userId: req.sessionUser.user_id,
          targetId: workflowId,
          targetType: "workflow",
          previousRecord: existingWorkflow,
          nextRecord: nextWorkflow,
          dataFields: ["wf_name", "wf_data"]
        });
        await createEntries(auditEntries, queryFn);
        return nextWorkflow;
      });

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
      const workflowId = Number(req.params.id);
      const existingWorkflow = await workflowModel.getWorkflowById(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      const deleted = await withUserTransaction(async (queryFn) => {
        const removedWorkflow = await workflowModel.deleteWorkflow(workflowId, queryFn);
        if (!removedWorkflow) {
          return null;
        }

        await createEntries(
          [
            buildDeleteAuditEntry({
              userId: req.sessionUser.user_id,
              targetId: workflowId,
              targetType: "workflow",
              changeType: "REMOVE_WORKFLOW"
            })
          ],
          queryFn
        );

        return removedWorkflow;
      });
      if (!deleted) {
        return res.status(404).json({ error: "Workflow not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

