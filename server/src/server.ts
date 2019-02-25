import 'reflect-metadata'; // Required for typeorm
import http from 'http';
import { ConnectionOptions, createConnection } from 'typeorm';

import { app, sessionMiddleware } from './app';
import { SocketServer } from './sockets/sockets';
import { GameRoomSocketHandlerFactory } from './sockets/game-room';
import config from './config/config';

// Only process unhandled promises in development mode
if (config.mode === 'development') {
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, '\nreason:', reason);
  });
}

async function run() {
  const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    host: config.postgres.host,
    port: config.postgres.port,
    username: config.postgres.username,
    password: config.postgres.password,
    database: config.postgres.database,
    entities: [
      `${__dirname}/entities/*.js`,
    ],
    migrations: [
      `${__dirname}/migrations/*.js`,
    ],
    synchronize: false,
    logging: config.mode === 'development',
  };

  // Init typeorm connection
  await createConnection(connectionOptions);

  const server = new http.Server(app);
  const socketHandlerFactory = new GameRoomSocketHandlerFactory();

  // socket server
  new SocketServer(
    socketHandlerFactory,
    server,
    sessionMiddleware,
    config.redis.host,
    config.redis.port,
    config.redis.password,
    config.socketIO.redisKey
  ).serve();

  // app server
  server.listen(config.web.port, config.web.host, () => {
    console.log(`Running on http://${config.web.host}:${config.web.port}/`);
  });
}

run().catch(err => {
  // Ensure we crash/terminate the process
  process.nextTick(() => {
    throw new Error(err);
  });
});
