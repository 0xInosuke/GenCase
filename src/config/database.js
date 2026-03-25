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
  }
};
