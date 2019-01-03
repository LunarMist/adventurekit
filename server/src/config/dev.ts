import AppSettings from './settings';

// Safety check
if (process.env.NODE_ENV !== 'development') {
  throw new Error(`process.env.NODE_ENV !== 'development'. Found: ${process.env.NODE_ENV}`);
} else {
  console.log('Loading dev config!');
}

const dev: AppSettings = {
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
      maxAge: 'P30D', // 30 days
      secure: false,
    },
    name: 'rpgcore.dev.sid',
    secret: 'rpgcore-session-dev-secret-goes-here-123',
    redisDB: 1,
    redisPrefix: 'rc.dev::',
  },
};

export = dev; // Has to be commonjs style
