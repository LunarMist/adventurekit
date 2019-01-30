import {SocketHandler, SocketHandlerFactory} from './sockets'
import {NetEventType, UserProfile} from 'rpgcore-common';

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

    this.listenChatMessage((message: string) => {
      this.sendChatMessage(this.passport.user.username, message);
    });

    this.listenUserProfileRequest(ack => {
      ack({username: this.passport.user.username});
    });
  }

  listenChatMessage(cb: (message: string) => void) {
    this.listenAuthenticated(NetEventType.ChatMessage, cb);
  }

  sendChatMessage(speaker: string, message: string) {
    this.io.emit(NetEventType.ChatMessage, speaker, message);
  }

  listenUserProfileRequest(cb: (ack: (profile: UserProfile) => void) => void) {
    this.listenAuthenticated(NetEventType.UserProfile, cb);
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
