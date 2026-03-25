const { queryUser } = require("../config/database");
const { buildPagedResult } = require("../utils/listQuery");

async function getOne(id) {
  const result = await queryUser(
    `SELECT id, user_name, display_name, user_password, status_code, created_at, updated_at
     FROM tb_user
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listUsers(options) {
    const searchValue = options.search ? `%${options.search}%` : null;
    const params = [searchValue, options.pageSize, (options.page - 1) * options.pageSize];
    const result = await queryUser(
      `SELECT
          id,
          user_name,
          display_name,
          user_password,
          status_code,
          created_at,
          updated_at,
          COUNT(*) OVER() AS total_count
       FROM tb_user
       WHERE ($1::text IS NULL OR user_name ILIKE $1 OR display_name ILIKE $1 OR status_code ILIKE $1)
       ORDER BY ${options.sortBy} ${options.sortDir}, id ASC
       LIMIT $2 OFFSET $3`,
      params
    );
    return buildPagedResult(result, options.page, options.pageSize);
  },

  getUserById: getOne,

  async createUser(payload) {
    const result = await queryUser(
      `INSERT INTO tb_user (user_name, display_name, user_password, status_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_name, display_name, user_password, status_code, created_at, updated_at`,
      [payload.user_name, payload.display_name, payload.user_password, payload.status_code]
    );
    return result.rows[0];
  },

  async updateUser(id, payload) {
    const result = await queryUser(
      `UPDATE tb_user
       SET display_name = $2,
           user_password = $3,
           status_code = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_name, display_name, user_password, status_code, created_at, updated_at`,
      [id, payload.display_name, payload.user_password, payload.status_code]
    );
    return result.rows[0] || null;
  },

  async deleteUser(id) {
    const result = await queryUser("DELETE FROM tb_user WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
