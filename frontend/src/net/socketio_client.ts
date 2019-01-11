import socketio from 'socket.io-client';
import {ListenCallback, NetClient} from 'Net/net_client';

/**
 * A socket.io implementation for {@link NetClient}.
 */
export class SocketIONetClient implements NetClient {
  private socket: SocketIOClient.Socket | null = null;

  constructor(readonly namespace: string = '') {

  }

  open(): void {
    if (this.socket !== null) {
      if (!this.socket.connected) {
        this.socket.open();
      }
      return;
    }

    const uri = `//${document.domain}:${location.port}/${this.namespace}`;
    this.socket = socketio(uri, {
      transports: ['websocket', 'polling'] // Prefer websocket to long polling
    });

    this.socket.on('connect', () => {
      this.socket && console.log(`SocketIO connected! Id: ${this.socket.id}`);
    });

    this.socket.on('disconnect', () => {
      console.log('SocketIO disconnected!');
    });
  }

  close(): void {
    if (this.socket !== null && this.socket.connected) {
      this.socket.close();
    }
    this.socket = null;
  }

  sendMessage(event: string, ...data: any[]): void {
    this.open();
    this.socket && this.socket.emit(event, ...data);
  }

  listen(event: string, cb: ListenCallback): void {
    this.open();
    this.socket && this.socket.on(event, cb);
  }
}
