const groupModel = require("../models/groupModel");

function parseGroupPayload(body) {
  const groupName = String(body.group_name || "").trim();
  const statusCode = Number(body.status_code);

  if (!groupName) {
    const error = new Error("group_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(statusCode)) {
    const error = new Error("status_code must be an integer.");
    error.statusCode = 400;
    throw error;
  }

  return {
    group_name: groupName,
    status_code: statusCode
  };
}

module.exports = {
  async list(_req, res, next) {
    try {
      res.json(await groupModel.listGroups());
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
      const created = await groupModel.createGroup(parseGroupPayload(req.body));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await groupModel.updateGroup(Number(req.params.id), parseGroupPayload(req.body));
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
