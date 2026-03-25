const { queryUser } = require("../config/database");

async function getOne(id) {
  const result = await queryUser(
    `SELECT id, group_name, status_code, created_at, updated_at
     FROM tb_group
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listGroups() {
    const result = await queryUser(
      `SELECT id, group_name, status_code, created_at, updated_at
       FROM tb_group
       ORDER BY id`
    );
    return result.rows;
  },

  getGroupById: getOne,

  async createGroup(payload) {
    const result = await queryUser(
      `INSERT INTO tb_group (group_name, status_code)
       VALUES ($1, $2)
       RETURNING id, group_name, status_code, created_at, updated_at`,
      [payload.group_name, payload.status_code]
    );
    return result.rows[0];
  },

  async updateGroup(id, payload) {
    const result = await queryUser(
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

  async deleteGroup(id) {
    const result = await queryUser("DELETE FROM tb_group WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
