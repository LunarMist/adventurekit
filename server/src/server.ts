import 'reflect-metadata'; // Required for typeorm
import http from 'http';
import { ConnectionOptions, createConnection } from 'typeorm';

import { app, sessionMiddleware } from './app';
import config from './config/config';
import { SocketIONetServer, SocketIONetServerSocket } from './sockets/socketio-server';
import { GameRoomSocketHandler } from './sockets/game-room';
import { GameNetSocket } from './sockets/game-net-socket';

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

  class SIOGameRoomBridge extends SocketIONetServerSocket {
    private handler: GameRoomSocketHandler;

    constructor(socket: SocketIO.Socket) {
      super(socket);
      this.handler = new GameRoomSocketHandler(new GameNetSocket(this), this);
    }

    async onConnection(): Promise<void> {
      return this.handler.onConnection();
    }
  }

  // socket server
  new SocketIONetServer(
    SIOGameRoomBridge,
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
    throw err;
  });
});
