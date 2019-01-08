import {SocketHandler, SocketHandlerFactory} from './sockets'

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  onConnection(): void {
    console.log(`User connected: ${this.socket.id}`);

    if (!this.isAuthenticated()) {
      // TODO: Relay back some type of message/alert?
      console.log(`User not authenticated: ${this.socket.id}. Disconnecting...`);
      this.disconnect();
      return;
    }

    this.listenAuthenticated('ChatMessage', (message: string) => {
      this.io.emit('ChatMessage', message);
    });
  }

  get request() {
    return this.socket.request;
  }

  get session() {
    return this.request.session;
  }

  get sessionStore() {
    return this.request.sessionStore;
  }

  isAuthenticated(): boolean {
    return this.session.passport.user !== undefined;
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

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
