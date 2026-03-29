const { queryUser } = require("../config/database");

module.exports = {
  async listByCaseId(caseId) {
    const result = await queryUser(
      `SELECT
          c.id,
          c.case_id,
          c.user_id,
          u.display_name,
          c.content,
          c.created_time,
          c.status_code
       FROM tb_comments c
       INNER JOIN tb_user u ON u.id = c.user_id
       WHERE c.case_id = $1
         AND c.status_code = 'ACT'
       ORDER BY c.created_time ASC, c.id ASC`,
      [caseId]
    );

    return result.rows;
  },

  async create(payload, queryFn = queryUser) {
    const result = await queryFn(
      `INSERT INTO tb_comments (case_id, user_id, content, status_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, case_id, user_id, created_time, status_code`,
      [payload.case_id, payload.user_id, payload.content, payload.status_code]
    );

    return result.rows[0];
  }
};

