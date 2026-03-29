const { queryUser } = require("../config/database");

module.exports = {
  async listByTarget(targetType, targetId) {
    const result = await queryUser(
      `SELECT
          a.id,
          a.user_id,
          u.display_name,
          a.target_id,
          a.target_type,
          a.timestamp,
          a.change_type,
          a.old_value,
          a.new_value
       FROM tb_audit a
       INNER JOIN tb_user u ON u.id = a.user_id
       WHERE a.target_type = $1
         AND a.target_id = $2
       ORDER BY a.timestamp DESC, a.id DESC`,
      [targetType, targetId]
    );

    return result.rows;
  },

  async create(payload, queryFn = queryUser) {
    const result = await queryFn(
      `INSERT INTO tb_audit (user_id, target_id, target_type, timestamp, change_type, old_value, new_value)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6)
       RETURNING id, user_id, target_id, target_type, timestamp, change_type, old_value, new_value`,
      [
        payload.user_id,
        payload.target_id,
        payload.target_type,
        payload.change_type,
        payload.old_value,
        payload.new_value
      ]
    );

    return result.rows[0];
  }
};
