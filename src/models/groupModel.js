const { queryUser } = require("../config/database");
const { buildPagedResult } = require("../utils/listQuery");

async function getOne(id, queryFn = queryUser) {
  const result = await queryFn(
    `SELECT id, group_name, status_code, created_at, updated_at
     FROM tb_group
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listGroups(options) {
    const searchValue = options.search ? `%${options.search}%` : null;
    const result = await queryUser(
      `SELECT
          id,
          group_name,
          status_code,
          created_at,
          updated_at,
          COUNT(*) OVER() AS total_count
       FROM tb_group
       WHERE ($1::text IS NULL OR group_name ILIKE $1 OR status_code ILIKE $1)
       ORDER BY ${options.sortBy} ${options.sortDir}, id ASC
       LIMIT $2 OFFSET $3`,
      [searchValue, options.pageSize, (options.page - 1) * options.pageSize]
    );
    return buildPagedResult(result, options.page, options.pageSize);
  },

  getGroupById: getOne,

  async createGroup(payload, queryFn = queryUser) {
    const result = await queryFn(
      `INSERT INTO tb_group (group_name, status_code)
       VALUES ($1, $2)
       RETURNING id, group_name, status_code, created_at, updated_at`,
      [payload.group_name, payload.status_code]
    );
    return result.rows[0];
  },

  async updateGroup(id, payload, queryFn = queryUser) {
    const result = await queryFn(
      `UPDATE tb_group
       SET group_name = $2,
           status_code = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, group_name, status_code, created_at, updated_at`,
      [id, payload.group_name, payload.status_code]
    );
    return result.rows[0] || null;
  },

  async deleteGroup(id, queryFn = queryUser) {
    const result = await queryFn("DELETE FROM tb_group WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
