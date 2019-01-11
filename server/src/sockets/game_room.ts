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
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
