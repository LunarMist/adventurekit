// Safety check
if (process.env.NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV != development. Found: ${process.env.NODE_ENV}`);
} else {
  console.log("Loading dev config!");
}

const config = {
  mode: process.env.NODE_ENV,
};

config.web = {
  host: 'localhost',
  port: 9000,
};

config.redis = {
  host: 'localhost',
  port: 6379,
};

config.postgres = {
  host: 'localhost',
  port: 5432,
  username: 'rpgcore_dev',
  password: 'xY<9msv?9_PD?)mk',
  database: 'rpgcore_dev',
};

config.socketIO = {
  redisKey: "rpgcore-socket.io-dev",
};

module.exports = config;
