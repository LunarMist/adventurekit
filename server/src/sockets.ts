import http from "http";
import socketio from "socket.io";
import socketio_redis from "socket.io-redis";

/**
 *
 */
export class GameRoomHandler {
  private io: SocketIO.Server;

  constructor(
    readonly bindServer: http.Server,
    readonly redisAdapterHost: string,
    readonly redisAdapterPort: number,
    readonly redisAdapterKey: string
  ) {
    // TODO: Followup on https://github.com/socketio/socket.io/issues/3259
    this.io = socketio(this.bindServer, {
      pingTimeout: 60000,
    });

    // Configure socketio redis adapter
    this.io.adapter(socketio_redis({
      host: this.redisAdapterHost,
      port: this.redisAdapterPort,
      key: this.redisAdapterKey,
    }));
  }

  serve(): void {
    const self = this;

    this.io.on('connection', function (socket) {
      console.log(`User connected: ${socket.id}`);

      socket.on("ChatMessage", function (message: string) {
        self.io.emit("ChatMessage", message);
      });
    });
  }
}
