import * as io from "socket.io-client"
import {AckCallback, ListenCallback, NetClient} from "Net/net_client";
import Socket = SocketIOClient.Socket;

/**
 * A socket.io implementation for {@link NetClient}.
 */
export class SocketIONetClient implements NetClient {
  private socket: Socket | null = null;

  constructor(readonly namespace: string = "") {

  }

  open(): void {
    const uri = `//${document.domain}:${location.port}/${this.namespace}`;
    this.socket = io.connect(uri, {
      transports: ['websocket', 'polling'] // Prefer websocket to long polling
    });

    this.socket.on('connect', () => {
      this.socket && console.log(`SocketIO connected! Id: ${this.socket.id}`);
    });

    this.socket.on('disconnect', () => {
      this.socket && console.log('SocketIO disconnected!');
    });
  }

  close(): void {
    if (this.socket !== null && this.socket.connected) {
      this.socket.close();
    }
  }

  sendMessage(event: number | string, data: any, ack: AckCallback): boolean {
    this.ensureOpen();
    this.socket && this.socket.emit(event.toString(), data, (d: any) => {
      if (ack !== null) {
        ack(d);
      }
    });
    return true;
  }

  listen(event: number | string, cb: ListenCallback): boolean {
    this.ensureOpen();
    this.socket && this.socket.on(event.toString(), cb);
    return true;
  }

  private ensureOpen() {
    if (this.socket === null) {
      this.open();
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }
}
