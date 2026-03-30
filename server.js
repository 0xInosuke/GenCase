const app = require("./src/app");
const { getAppConfig } = require("./src/config/env");
const { logStartup, accessLogPath, errorLogPath } = require("./src/utils/logger");

const config = getAppConfig();

app.listen(config.port, () => {
  logStartup(`GenCase listening on http://127.0.0.1:${config.port} access_log=${accessLogPath} error_log=${errorLogPath}`);
});
