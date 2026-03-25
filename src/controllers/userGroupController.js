const userGroupModel = require("../models/userGroupModel");
const { STATUS_CODES } = require("../constants/statusCodes");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");

function parseUserGroupPayload(body) {
  const userId = Number(body.user_id);
  const groupId = Number(body.group_id);
  const statusCode = String(body.status_code || "").trim().toUpperCase();

  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("user_id must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(groupId) || groupId <= 0) {
    const error = new Error("group_id must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  if (!STATUS_CODES.includes(statusCode)) {
    const error = new Error(`status_code must be one of: ${STATUS_CODES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    user_id: userId,
    group_id: groupId,
    status_code: statusCode
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(query.sort_by, query.sort_dir, ["id", "user_id", "group_id", "status_code", "user_name", "display_name", "group_name", "created_at"], "id");

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
      res.json(await userGroupModel.listUserGroups(parseListOptions(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await userGroupModel.getUserGroupById(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ error: "User group relation not found." });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const created = await userGroupModel.createUserGroup(parseUserGroupPayload(req.body));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await userGroupModel.updateUserGroup(Number(req.params.id), parseUserGroupPayload(req.body));
      if (!updated) {
        return res.status(404).json({ error: "User group relation not found." });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await userGroupModel.deleteUserGroup(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "User group relation not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
