const configPath = process.env.CONFIG_PATH || "./dev.js";

console.log(`Loading config from: ${configPath}`);

const config = require(configPath);

export default config;
