import AppSettings from "./settings";

const configPath = process.env.CONFIG_PATH || "./dev";

console.log(`Loading config from: ${configPath}`);

const settings: AppSettings = require(configPath);

export default settings;
