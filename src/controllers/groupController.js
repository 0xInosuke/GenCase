const groupModel = require("../models/groupModel");
const { STATUS_CODES } = require("../constants/statusCodes");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");
const { withUserTransaction } = require("../config/database");
const { buildCreateAuditEntries, buildUpdateAuditEntries, createEntries } = require("../services/auditService");

function parseGroupPayload(body) {
  const groupName = String(body.group_name || "").trim();
  const statusCode = String(body.status_code || "").trim().toUpperCase();

  if (!groupName) {
    const error = new Error("group_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!STATUS_CODES.includes(statusCode)) {
    const error = new Error(`status_code must be one of: ${STATUS_CODES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    group_name: groupName,
    status_code: statusCode
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(query.sort_by, query.sort_dir, ["id", "group_name", "status_code", "created_at"], "id");

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
      res.json(await groupModel.listGroups(parseListOptions(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await groupModel.getGroupById(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ error: "Group not found." });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payload = parseGroupPayload(req.body);
      const created = await withUserTransaction(async (queryFn) => {
        const nextGroup = await groupModel.createGroup(payload, queryFn);
        const auditEntries = buildCreateAuditEntries({
          userId: req.sessionUser.user_id,
          targetId: nextGroup.id,
          targetType: "group",
          record: nextGroup,
          dataFields: ["group_name"]
        });
        await createEntries(auditEntries, queryFn);
        return nextGroup;
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const groupId = Number(req.params.id);
      const payload = parseGroupPayload(req.body);
      const existingGroup = await groupModel.getGroupById(groupId);
      if (!existingGroup) {
        return res.status(404).json({ error: "Group not found." });
      }

      const updated = await withUserTransaction(async (queryFn) => {
        const nextGroup = await groupModel.updateGroup(groupId, payload, queryFn);
        const auditEntries = buildUpdateAuditEntries({
          userId: req.sessionUser.user_id,
          targetId: groupId,
          targetType: "group",
          previousRecord: existingGroup,
          nextRecord: nextGroup,
          dataFields: ["group_name"]
        });
        await createEntries(auditEntries, queryFn);
        return nextGroup;
      });

      if (!updated) {
        return res.status(404).json({ error: "Group not found." });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await groupModel.deleteGroup(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "Group not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
