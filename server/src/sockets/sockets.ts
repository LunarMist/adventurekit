import http from 'http';
import socketio from 'socket.io';
import socketio_redis from 'socket.io-redis';
import {RequestHandler} from 'express';

export abstract class SocketHandler {
  constructor(
    readonly io: SocketIO.Server,
    readonly socket: SocketIO.Socket,
  ) {

  }

  abstract onConnection(): void;

  get request() {
    return this.socket.request;
  }

  get session() {
    return this.request.session;
  }

  get sessionStore() {
    return this.request.sessionStore;
  }

  get passport() {
    return this.session.passport;
  }

  isAuthenticated(): boolean {
    return this.passport && this.passport.user !== undefined;
  }

  touchSession(): void {
    // TODO: Implement better other than reaching in and doing this manually
    const key = this.sessionStore.prefix + this.session.id;
    const ttl = this.sessionStore.ttl;
    this.sessionStore.client.expire(key, ttl);
  }

  disconnect(): void {
    this.socket.disconnect(true);
  }

  listenAuthenticated(event: string, listener: (...args: any[]) => any): void {
    this.socket.on(event, (...captureArgs: any[]) => {
      this.session.reload((err: any) => {
        if (err) {
          // TODO: Something better
          console.error(err);
          return;
        }
        if (!this.isAuthenticated()) {
          console.log(`User not authenticated: ${this.socket.id}. Disconnecting...`);
          this.disconnect();
          return;
        }
        listener(...captureArgs);
        this.touchSession();
      });
    });
  }
}

export interface SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler;
}

/**
 * Base class with socket.io skeleton code.
 * TODO: Refactor into more generic handler class?
 */
export class SocketServer {
  protected readonly io: SocketIO.Server;

  constructor(
    readonly handlerFactory: SocketHandlerFactory,
    readonly bindServer: http.Server,
    readonly expressSessionMiddleware: RequestHandler,
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
    this.io.use((socket, next) => {
      // @ts-ignore
      // https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
      this.expressSessionMiddleware(socket.request, {}, next);
    });

    this.io.on('connection', s => {
      this.handlerFactory.create(this.io, s).onConnection();
    });
  }
}
