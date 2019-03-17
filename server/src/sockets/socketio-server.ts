import http from 'http';
import socketIo from 'socket.io';
import socketIoRedis from 'socket.io-redis';

import { ListenCallback, NetServer, NetServerSocket } from './net-server';
import { RequestHandler } from 'express';
import { SessionizedSocket } from './sess-socket';

/**
 * A socket.io implementation for {@link NetServerSocket} and {@link SessionizedSocket}
 */
export abstract class SocketIONetServerSocket implements NetServerSocket, SessionizedSocket<any> {
  private readonly socket: SocketIO.Socket;
  private readonly io: SocketIO.Server;

  protected constructor(socket: SocketIO.Socket) {
    this.socket = socket;
    this.io = socket.server;
  }

  /** {@link NetServerSocket} functions **/

  get socketId(): string {
    return this.socket.id;
  }

  sendMessage<T>(event: string, ...data: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.socket.emit(event, ...data, (...ackData: any[]) => {
        resolve(...ackData);
      });
    });
  }

  sendSimpleMessage(event: string, ...data: any[]): void {
    this.socket.emit(event, ...data);
  }

  sendGroupMessage(event: string, group: string, ...data: any[]): void {
    this.io.to(group).emit(event, ...data);
  }

  leaveGroup(group: string): void {
    this.socket.leave(group);
  }

  joinGroup(group: string): void {
    this.socket.join(group);
  }

  get groups(): string[] {
    return Object.keys(this.socket.rooms);
  }

  listen(event: string, cb: ListenCallback): void {
    this.socket.on(event, cb);
  }

  listenAuthenticated(event: string, listener: (...args: any[]) => any): void {
    this.socket.on(event, (...captureArgs: any[]) => {
      this.session.reload((err: any) => {
        if (err) {
          console.error(err);
          return;
        }
        if (!this.authenticated) {
          console.log(`User not authenticated: ${this.socketId}. Disconnecting...`);
          this.disconnect();
          return;
        }
        listener(...captureArgs);
        this.touchSession();
      });
    });
  }

  disconnect(): void {
    this.socket.disconnect(true);
  }

  /** {@link SessionizedSocket} functions **/

  get authenticated(): boolean {
    return this.passport && this.passport.user !== undefined && this.passport.user !== null;
  }

  get sessionUser() {
    return this.passport.user;
  }

  /** Other functions **/

  abstract async onConnection(): Promise<void>;

  private get request() {
    return this.socket.request;
  }

  private get session() {
    return this.request.session;
  }

  private get sessionStore() {
    return this.request.sessionStore;
  }

  private get passport() {
    return this.session.passport;
  }

  private touchSession(): void {
    // TODO: Implement better other than reaching in and doing this manually
    const key = this.sessionStore.prefix + this.session.id;
    const ttl = this.sessionStore.ttl;
    this.sessionStore.client.expire(key, ttl, (err: Error | null, reply: number) => {
      if (err) {
        console.error(err);
      }
    });
  }
}

/**
 * A socket.io implementation for {@link NetServer}
 */
export class SocketIONetServer<T extends SocketIONetServerSocket> implements NetServer {
  private readonly io: SocketIO.Server;

  constructor(
    private readonly socketClazz: new(socket: SocketIO.Socket) => T,
    private readonly bindServer: http.Server,
    private readonly expressSessionMiddleware: RequestHandler,
    private readonly redisAdapterHost: string,
    private readonly redisAdapterPort: number,
    private readonly redisAdapterPass: string | undefined,
    private readonly redisAdapterKey: string
  ) {
    // TODO: Followup on https://github.com/socketio/socket.io/issues/3259
    this.io = socketIo(this.bindServer, {
      pingTimeout: 60000,
    });

    // Configure socketio redis adapter
    this.io.adapter(socketIoRedis({
      host: this.redisAdapterHost,
      port: this.redisAdapterPort,
      auth_pass: this.redisAdapterPass,
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
      new this.socketClazz(s)
        .onConnection()
        .catch(console.error);
    });
  }
}
