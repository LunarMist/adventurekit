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
    this.sendUserProfile(this.passport.user.username);

    this.listenChatMessage((message: string) => {
      this.sendChatMessage(message);
    });
  }

  listenChatMessage(cb: (message: string) => void) {
    this.listenAuthenticated(NetEventType.ChatMessage, cb);
  }

  sendChatMessage(message: string) {
    this.io.emit(NetEventType.ChatMessage, message);
  }

  sendUserProfile(username: string) {
    this.socket.emit(NetEventType.UserProfile, username);
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
