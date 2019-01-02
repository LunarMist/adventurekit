import http from "http";
// Required for typeorm
import "reflect-metadata";

import {app} from "./app";
import {GameRoomHandler} from "./sockets";
import config from "./config/config";

const server = new http.Server(app);

// socket server
new GameRoomHandler(
  server,
  config.redis.host,
  config.redis.port,
  config.socketIO.redisKey
).serve();

// app server
server.listen(config.web.port, config.web.host, () => {
  console.log(`Running on http://${config.web.host}:${config.web.port}/`);
});
