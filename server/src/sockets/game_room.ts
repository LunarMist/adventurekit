import {SocketHandler, SocketHandlerFactory} from './sockets'

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  onConnection(): void {
    console.log(`User connected: ${this.socket.id}`);

    if (!this.isAuthenticated()) {
      this.disconnect();
      return;
    }

    this.listenAuthenticated('ChatMessage', (message: string) => {
      this.io.emit('ChatMessage', message);
    });
  }

  get session() {
    return this.socket.request.session;
  }

  get request() {
    return this.socket.request;
  }

  isAuthenticated(): boolean {
    return this.session.passport.user !== undefined;
  }

  touchSession(): void {
    // TODO: Implement
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
