const userModel = require("../models/userModel");

function parseUserPayload(body) {
  const userName = String(body.user_name || "").trim();
  const userPassword = String(body.user_password || "").trim();
  const statusCode = Number(body.status_code);

  if (!userName) {
    const error = new Error("user_name is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!userPassword) {
    const error = new Error("user_password is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(statusCode)) {
    const error = new Error("status_code must be an integer.");
    error.statusCode = 400;
    throw error;
  }

  return {
    user_name: userName,
    user_password: userPassword,
    status_code: statusCode
  };
}

module.exports = {
  async list(_req, res, next) {
    try {
      res.json(await userModel.listUsers());
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
      const created = await userModel.createUser(parseUserPayload(req.body));
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await userModel.updateUser(Number(req.params.id), parseUserPayload(req.body));
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
