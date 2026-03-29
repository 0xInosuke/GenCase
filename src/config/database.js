const { Pool } = require("pg");
const { getAppConfig } = require("./env");

const config = getAppConfig();

const adminPool = new Pool(config.adminDb);
const userPool = new Pool(config.userDb);

module.exports = {
  adminPool,
  userPool,
  queryAdmin(text, params = []) {
    return adminPool.query(text, params);
  },
  queryUser(text, params = []) {
    return userPool.query(text, params);
  },
  async withUserTransaction(callback) {
    const client = await userPool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback((text, params = []) => client.query(text, params), client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};
