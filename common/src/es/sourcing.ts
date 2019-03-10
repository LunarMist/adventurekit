// TODO: Use protobuf?
export class ClientSentEvent {
  readonly messageId: string;
  readonly category: string;
  readonly data: ArrayBuffer; // ArrayBuffer is required by socket.io to serde properly

  constructor(messageId: string, category: string, data: Uint8Array | ArrayBuffer | Buffer) {
    this.messageId = messageId;
    this.category = category;
    // This copy is done because the underlying ArrayBuffer of the data object may be larger than the actual data
    // So we need to copy it
    if (data instanceof Buffer) {
      this.data = Uint8Array.from(data).buffer;
    } else if (data instanceof Uint8Array) {
      this.data = Uint8Array.from(data).buffer;
    } else if (data instanceof ArrayBuffer) {
      this.data = data;
    } else {
      throw Error('Unknown data type');
    }
  }

  get dataUi8(): Uint8Array {
    return new Uint8Array(this.data);
  }
}

// TODO: Use protobuf?
export class ServerSentEvent {
  readonly sequenceNumber: number;
  readonly messageId: string;
  readonly category: string;
  readonly data: ArrayBuffer; // ArrayBuffer is required by socket.io to serde properly

  constructor(sequenceNumber: number, messageId: string, category: string, data: Uint8Array | ArrayBuffer | Buffer) {
    this.sequenceNumber = sequenceNumber;
    this.messageId = messageId;
    this.category = category;
    // This copy is done because the underlying ArrayBuffer of the data object may be larger than the actual data
    // So we need to copy it
    if (data instanceof Buffer) {
      this.data = Uint8Array.from(data).buffer;
    } else if (data instanceof Uint8Array) {
      this.data = Uint8Array.from(data).buffer;
    } else if (data instanceof ArrayBuffer) {
      this.data = data;
    } else {
      throw Error('Unknown data type');
    }
  }

  get dataUi8(): Uint8Array {
    return new Uint8Array(this.data);
  }
}

export type EventAggResponse = { status: boolean; data: ArrayBuffer | null };
