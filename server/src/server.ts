import 'reflect-metadata'; // Required for typeorm
import http from 'http';
import {ConnectionOptions, createConnection} from 'typeorm';

import {app, sessionMiddleware} from './app';
import {SocketServer} from './sockets/sockets';
import config from './config/config';
import {GameRoomSocketHandlerFactory} from './sockets/game_room';

function startServer(): void {
  const server = new http.Server(app);

  // socket server
  new SocketServer(
    new GameRoomSocketHandlerFactory(),
    server,
    sessionMiddleware,
    config.redis.host,
    config.redis.port,
    config.socketIO.redisKey
  ).serve();

  // app server
  server.listen(config.web.port, config.web.host, () => {
    console.log(`Running on http://${config.web.host}:${config.web.port}/`);
  });
}

const connectionOptions: ConnectionOptions = {
  type: 'postgres',
  host: config.postgres.host,
  port: config.postgres.port,
  username: config.postgres.username,
  password: config.postgres.password,
  database: config.postgres.database,
  entities: [
    __dirname + '/entities/*.js'
  ],
  migrations: [
    __dirname + '/migrations/*.js'
  ],
  synchronize: false,
  logging: config.mode === 'development',
};

// Database connection
createConnection(connectionOptions)
  .then(connection => {
    startServer();
  });
