import http from "http";
import "reflect-metadata"; // Required for typeorm
import {app} from "./app";
import GameRoomSocketHandler from "./sockets/game_room";
import config from "./config/config";

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
