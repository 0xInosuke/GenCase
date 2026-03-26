const { queryUser } = require("../config/database");
const { buildPagedResult } = require("../utils/listQuery");

const CASE_DETAIL_SELECT = `
  SELECT
      c.id,
      c.workflow_id,
      w.wf_name,
      c.case_title,
      c.stage_code,
      c.case_data,
      c.created_at,
      c.updated_at
  FROM tb_case c
  INNER JOIN tb_workflow w ON w.id = c.workflow_id
`;

const CASE_VISIBILITY_EXISTS = `
  EXISTS (
      SELECT 1
      FROM tb_user_group ug
      INNER JOIN tb_group g ON g.id = ug.group_id
      WHERE ug.user_id = $1
        AND ug.status_code = 'ACT'
        AND g.status_code = 'ACT'
        AND (w.wf_data->'access'->c.stage_code) ? g.group_name
  )
`;

async function getOneForUser(id, userId) {
  const result = await queryUser(
    `${CASE_DETAIL_SELECT}
     WHERE c.id = $2
       AND ${CASE_VISIBILITY_EXISTS}`,
    [userId, id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async countVisibleCases(userId) {
    const result = await queryUser(
      `SELECT COUNT(*) AS visible_count
       FROM tb_case c
       INNER JOIN tb_workflow w ON w.id = c.workflow_id
       WHERE ${CASE_VISIBILITY_EXISTS}`,
      [userId]
    );
    return Number(result.rows[0]?.visible_count || 0);
  },

  async canUserAccessWorkflowStage(userId, workflowId, stageCode) {
    const result = await queryUser(
      `SELECT EXISTS (
          SELECT 1
          FROM tb_workflow w
          INNER JOIN tb_user_group ug ON ug.user_id = $1 AND ug.status_code = 'ACT'
          INNER JOIN tb_group g ON g.id = ug.group_id AND g.status_code = 'ACT'
          WHERE w.id = $2
            AND (w.wf_data->'access'->$3) ? g.group_name
       ) AS is_allowed`,
      [userId, workflowId, stageCode]
    );

    return result.rows[0]?.is_allowed === true;
  },

  async listCases(options, userId) {
    const searchValue = options.search ? `%${options.search}%` : null;
    const result = await queryUser(
      `SELECT
          c.id,
          c.workflow_id,
          w.wf_name,
          c.case_title,
          c.stage_code,
          c.case_data,
          c.created_at,
          c.updated_at,
          COUNT(*) OVER() AS total_count
       FROM tb_case c
       INNER JOIN tb_workflow w ON w.id = c.workflow_id
       WHERE ${CASE_VISIBILITY_EXISTS}
         AND (
           $2::text IS NULL
           OR w.wf_name ILIKE $2
           OR c.case_title ILIKE $2
           OR c.stage_code ILIKE $2
           OR c.case_data::text ILIKE $2
         )
       ORDER BY ${options.sortBy} ${options.sortDir}, c.id ASC
       LIMIT $3 OFFSET $4`,
      [userId, searchValue, options.pageSize, (options.page - 1) * options.pageSize]
    );

    return buildPagedResult(result, options.page, options.pageSize);
  },

  getCaseByIdForUser: getOneForUser,

  async getCaseById(id) {
    const result = await queryUser(
      `${CASE_DETAIL_SELECT}
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  },

  async createCase(payload, userId) {
    const result = await queryUser(
      `INSERT INTO tb_case (workflow_id, case_title, case_data, stage_code)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id`,
      [payload.workflow_id, payload.case_title, JSON.stringify(payload.case_data), payload.stage_code]
    );
    return getOneForUser(result.rows[0].id, userId);
  },

  async updateCase(id, payload, userId) {
    const result = await queryUser(
      `UPDATE tb_case
       SET case_title = $2,
           case_data = $3::jsonb,
           stage_code = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id, payload.case_title, JSON.stringify(payload.case_data), payload.stage_code]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return getOneForUser(id, userId);
  },

  async deleteCase(id) {
    const result = await queryUser("DELETE FROM tb_case WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
