const userModel = require("../models/userModel");
const { STATUS_CODES } = require("../constants/statusCodes");
const { clampPageSize, normalizeSort, parsePositiveInteger } = require("../utils/listQuery");

function parseCreatePayload(body) {
  const userName = String(body.user_name || "").trim();
  const displayName = String(body.display_name || "").trim();
  const userPassword = String(body.user_password || "").trim();
  const statusCode = String(body.status_code || "").trim().toUpperCase();

  if (!userName) {
    const error = new Error("user_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!displayName) {
    const error = new Error("display_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!userPassword) {
    const error = new Error("user_password is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!STATUS_CODES.includes(statusCode)) {
    const error = new Error(`status_code must be one of: ${STATUS_CODES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    user_name: userName,
    display_name: displayName,
    user_password: userPassword,
    status_code: statusCode
  };
}

function parseUpdatePayload(body) {
  const displayName = String(body.display_name || "").trim();
  const userPassword = String(body.user_password || "").trim();
  const statusCode = String(body.status_code || "").trim().toUpperCase();

  if (!displayName) {
    const error = new Error("display_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!userPassword) {
    const error = new Error("user_password is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!STATUS_CODES.includes(statusCode)) {
    const error = new Error(`status_code must be one of: ${STATUS_CODES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    display_name: displayName,
    user_password: userPassword,
    status_code: statusCode
  };
}

function parseListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = clampPageSize(query.page_size);
  const sort = normalizeSort(query.sort_by, query.sort_dir, ["id", "display_name", "status_code", "user_name", "created_at"], "id");

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
      res.json(await userModel.listUsers(parseListOptions(req.query)));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await userModel.getUserById(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const created = await userModel.createUser(parseCreatePayload(req.body));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await userModel.updateUser(Number(req.params.id), parseUpdatePayload(req.body));
      if (!updated) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await userModel.deleteUser(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "User not found." });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
