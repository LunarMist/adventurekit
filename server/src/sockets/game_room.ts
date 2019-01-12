import {SocketHandler, SocketHandlerFactory} from './sockets'
import {NetEventType} from 'rpgcore-common';

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

    // Send user data on socket connection
    this.socket.emit(NetEventType.UserProfile, this.passport.user.username);

    this.listenAuthenticated(NetEventType.ChatMessage, (message: string) => {
      this.io.emit(NetEventType.ChatMessage, message);
    });
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
