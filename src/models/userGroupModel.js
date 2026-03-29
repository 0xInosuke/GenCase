const { queryUser } = require("../config/database");
const { buildPagedResult } = require("../utils/listQuery");

async function getOne(id, queryFn = queryUser) {
  const result = await queryFn(
    `SELECT id, user_id, user_name, display_name, group_id, group_name, status_code, created_at, updated_at
     FROM v_user_group_detail
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listUserGroups(options) {
    const searchValue = options.search ? `%${options.search}%` : null;
    const result = await queryUser(
      `SELECT
          id,
          user_id,
          user_name,
          display_name,
          group_id,
          group_name,
          status_code,
          created_at,
          updated_at,
          COUNT(*) OVER() AS total_count
       FROM v_user_group_detail
       WHERE (
         $1::text IS NULL
         OR user_name ILIKE $1
         OR display_name ILIKE $1
         OR group_name ILIKE $1
         OR status_code ILIKE $1
       )
       ORDER BY ${options.sortBy} ${options.sortDir}, id ASC
       LIMIT $2 OFFSET $3`,
      [searchValue, options.pageSize, (options.page - 1) * options.pageSize]
    );
    return buildPagedResult(result, options.page, options.pageSize);
  },

  getUserGroupById: getOne,

  async createUserGroup(payload, queryFn = queryUser) {
    const result = await queryFn(
      `INSERT INTO tb_user_group (user_id, group_id, status_code)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [payload.user_id, payload.group_id, payload.status_code]
    );
    return getOne(result.rows[0].id, queryFn);
  },

  async updateUserGroup(id, payload, queryFn = queryUser) {
    const result = await queryFn(
      `UPDATE tb_user_group
       SET user_id = $2,
           group_id = $3,
           status_code = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id, payload.user_id, payload.group_id, payload.status_code]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return getOne(id, queryFn);
  },

  async deleteUserGroup(id, queryFn = queryUser) {
    const result = await queryFn("DELETE FROM tb_user_group WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
