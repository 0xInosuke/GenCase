const { queryUser } = require("../config/database");

async function getOne(id) {
  const result = await queryUser(
    `SELECT id, user_name, user_password, status_code, created_at, updated_at
     FROM tb_user
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  async listUsers() {
    const result = await queryUser(
      `SELECT id, user_name, user_password, status_code, created_at, updated_at
       FROM tb_user
       ORDER BY id`
    );
    return result.rows;
  },

  getUserById: getOne,

  async createUser(payload) {
    const result = await queryUser(
      `INSERT INTO tb_user (user_name, user_password, status_code)
       VALUES ($1, $2, $3)
       RETURNING id, user_name, user_password, status_code, created_at, updated_at`,
      [payload.user_name, payload.user_password, payload.status_code]
    );
    return result.rows[0];
  },

  async updateUser(id, payload) {
    const result = await queryUser(
      `UPDATE tb_user
       SET user_name = $2,
           user_password = $3,
           status_code = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_name, user_password, status_code, created_at, updated_at`,
      [id, payload.user_name, payload.user_password, payload.status_code]
    );
    return result.rows[0] || null;
  },

  async deleteUser(id) {
    const result = await queryUser("DELETE FROM tb_user WHERE id = $1 RETURNING id", [id]);
    return result.rows[0] || null;
  }
};
