import SocketHandler from "./sockets"


/**
 * Game room socket.io handler.
 */
export default class GameRoomSocketHandler extends SocketHandler {
  onNewUserConnected(socket: SocketIO.Socket): void {
    console.log(`User connected: ${socket.id}`);

    socket.on("ChatMessage", (message: string) => {
      this.io.emit("ChatMessage", message);
    });
  }
}
