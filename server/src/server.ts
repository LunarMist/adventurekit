import 'reflect-metadata'; // Required for typeorm
import http from 'http';
import {ConnectionOptions, createConnection} from 'typeorm';

import app from './app';
import GameRoomSocketHandler from './sockets/game_room';
import config from './config/config';

function startServer(): void {
  const server = new http.Server(app);

  // socket server
  new GameRoomSocketHandler(
    server,
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
    __dirname + '/migration/*.js'
  ],
  synchronize: true,
  logging: config.mode === 'development',
};

// Database connection
createConnection(connectionOptions)
  .then(connection => {
    startServer();
  });
