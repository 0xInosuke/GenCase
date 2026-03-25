const { queryUser } = require("../config/database");

async function getOne(id) {
  const result = await queryUser(
    `SELECT id, user_id, user_name, group_id, group_name, status_code, created_at, updated_at
     FROM v_user_group_detail
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listUserGroups() {
    const result = await queryUser(
      `SELECT id, user_id, user_name, group_id, group_name, status_code, created_at, updated_at
       FROM v_user_group_detail
       ORDER BY id`
    );
    return result.rows;
  },

  getUserGroupById: getOne,

  async createUserGroup(payload) {
    const result = await queryUser(
      `INSERT INTO tb_user_group (user_id, group_id, status_code)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [payload.user_id, payload.group_id, payload.status_code]
    );
    return getOne(result.rows[0].id);
  },

  async updateUserGroup(id, payload) {
    const result = await queryUser(
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

    return getOne(id);
  },

  async deleteUserGroup(id) {
    const result = await queryUser("DELETE FROM tb_user_group WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
