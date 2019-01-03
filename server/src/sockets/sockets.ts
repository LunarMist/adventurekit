import http from 'http';
import socketio from 'socket.io';
import socketio_redis from 'socket.io-redis';


/**
 * Base class with socket.io skeleton code.
 * TODO: Refactor into more generic handler class?
 */
export default abstract class SocketHandler {
  protected readonly io: SocketIO.Server;

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
    this.io.on('connection', s => this.onNewUserConnected(s));
  }

  abstract onNewUserConnected(socket: SocketIO.Socket): void;
}
