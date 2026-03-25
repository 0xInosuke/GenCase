const app = require("./src/app");
const { getAppConfig } = require("./src/config/env");

const config = getAppConfig();

app.listen(config.port, () => {
  console.log(`GenCase listening on http://127.0.0.1:${config.port}`);
});
