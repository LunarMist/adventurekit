import { AppSettings, AppSettingsSecret } from './settings';

// Safety check
if (process.env.NODE_ENV !== 'development') {
  throw new Error(`process.env.NODE_ENV !== 'development'. Found: ${process.env.NODE_ENV}`);
} else {
  console.log('Loading development config!');
}

// Load secret configs
const secret: AppSettingsSecret = require('./dev-secret');
if (!secret) {
  throw new Error('Missing dev-secret module!');
}

const dev: AppSettings = {
  secret,
  mode: 'development',
  web: {
    host: 'localhost',
    port: 9000,
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
  postgres: {
    host: 'localhost',
    port: 5432,
    username: 'rpgcore_dev',
    password: 'xY<9msv?9_PD?)mk',
    database: 'rpgcore_dev',
  },
  socketIO: {
    redisKey: 'rpgcore-socket.io-dev',
  },
  session: {
    cookie: {
      secure: false,
    },
    name: 'rpgcore.dev.sid',
    secret: 'rpgcore-session-dev-secret-goes-here-123',
    redisDB: 1,
    redisPrefix: 'rpgcore.dev.session::',
    ttl: 'P30D', // 30 days
  },
  registration: {
    urlBase: 'http://localhost:9000',
    jwtSecret: 'rpgcore-registration-dev-secret-goes-here-123',
  },
};

export = dev; // Has to be commonjs style
