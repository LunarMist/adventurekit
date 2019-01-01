// Safety check
if (process.env.NODE_ENV !== 'development') {
  throw new Error(`NODE_ENV != development. Found: ${process.env.NODE_ENV}`);
}

const config = {
  mode: process.env.NODE_ENV
};

config.web = {
  host: 'localhost',
  port: 9000,
};

module.exports = config;
