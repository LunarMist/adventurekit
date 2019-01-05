import {SocketHandler, SocketHandlerFactory} from './sockets'


/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  onConnection(): void {
    console.log(`User connected: ${this.socket.id}`);

    this.socket.on('ChatMessage', (message: string) => {
      console.log(`Session: ${this.socket.request.session.id}`);

      this.io.emit('ChatMessage', 'Authenticated: ' + this.socket.request.isAuthenticated());
      this.io.emit('ChatMessage', 'Session id: ' + this.socket.request.session.id);
      this.io.emit('ChatMessage', 'Session info: ' + JSON.stringify(this.socket.request.session));
    });
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
