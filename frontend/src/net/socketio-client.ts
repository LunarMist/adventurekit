import socketIoClient from 'socket.io-client';
import { ListenCallback, NetClient } from 'Net/net-client';

/**
 * A socket.io implementation for {@link NetClient}.
 */
export class SocketIONetClient implements NetClient {
  private socket: SocketIOClient.Socket | null = null;

  constructor(readonly namespace: string = '') {

  }

  open(): boolean {
    if (this.socket !== null) {
      if (!this.socket.connected) {
        this.socket.open();
        return true;
      }
      return false;
    }

    const uri = `//${document.domain}:${location.port}/${this.namespace}`;
    this.socket = socketIoClient(uri, {
      transports: ['websocket', 'polling'], // Prefer websocket to long polling
    });

    this.socket.on('connect', () => {
      this.socket && console.log(`SocketIO connected! Id: ${this.socket.id}`);
    });

    this.socket.on('disconnect', () => {
      console.log('SocketIO disconnected!');
    });

    return true;
  }

  close(): void {
    if (this.socket !== null && this.socket.connected) {
      this.socket.close();
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  async sendMessage<T>(event: string, ...data: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const needWait: boolean = this.open();
      this.tryWait(() => {
        this.socket && this.socket.emit(event, ...data, (...ackData: any[]) => {
          resolve(...ackData);
        });
      }, 500, 10, needWait);
    });
  }

  sendSimpleMessage(event: string, ...data: any[]): void {
    const needWait: boolean = this.open();
    this.tryWait(() => {
      this.socket && this.socket.emit(event, ...data);
    }, 500, 10, needWait);
  }

  listen(event: string, cb: ListenCallback): void {
    this.open();
    this.socket && this.socket.on(event, cb);
  }

  // In the case that we just opened the socket, we need to delay sending the message by a bit; otherwise, the message may not be handled properly
  // The server may not be ready to handle the request, and may be authenticating the user and setting up listeners
  // This should be a rare occurrence, and only happen on reconnection/constant disconnects->reconnects
  // This function will try to wait up to {limit} times, with delay of {timeout}. When {limit} runs out, {cb} will be invoked anyways.
  tryWait(cb: () => void, timeout: number, limit: number, needWait: boolean) {
    if (!needWait || limit <= 0) {
      cb();
      return;
    }
    setTimeout(() => {
      this.tryWait(cb, timeout, limit - 1, !this.isConnected());
    }, timeout);
  }
}
