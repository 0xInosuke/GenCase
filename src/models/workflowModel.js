const { queryUser } = require("../config/database");
const { buildPagedResult } = require("../utils/listQuery");

async function getOne(id, queryFn = queryUser) {
  const result = await queryFn(
    `SELECT id, wf_name, status_code, wf_data, created_at, updated_at
     FROM tb_workflow
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listWorkflows(options) {
    const searchValue = options.search ? `%${options.search}%` : null;
    const result = await queryUser(
      `SELECT
          id,
          wf_name,
          status_code,
          wf_data,
          created_at,
          updated_at,
          COUNT(*) OVER() AS total_count
       FROM tb_workflow
       WHERE (
         $1::text IS NULL
         OR wf_name ILIKE $1
         OR status_code ILIKE $1
         OR wf_data::text ILIKE $1
       )
       ORDER BY ${options.sortBy} ${options.sortDir}, id ASC
       LIMIT $2 OFFSET $3`,
      [searchValue, options.pageSize, (options.page - 1) * options.pageSize]
    );
    return buildPagedResult(result, options.page, options.pageSize);
  },

  getWorkflowById: getOne,

  async createWorkflow(payload, queryFn = queryUser) {
    const result = await queryFn(
      `INSERT INTO tb_workflow (wf_name, status_code, wf_data)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, wf_name, status_code, wf_data, created_at, updated_at`,
      [payload.wf_name, payload.status_code, JSON.stringify(payload.wf_data)]
    );
    return result.rows[0];
  },

  async updateWorkflow(id, payload, queryFn = queryUser) {
    const result = await queryFn(
      `UPDATE tb_workflow
       SET wf_name = $2,
           status_code = $3,
           wf_data = $4::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, wf_name, status_code, wf_data, created_at, updated_at`,
      [id, payload.wf_name, payload.status_code, JSON.stringify(payload.wf_data)]
    );
    return result.rows[0] || null;
  },

  async deleteWorkflow(id, queryFn = queryUser) {
    const result = await queryFn("DELETE FROM tb_workflow WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};

