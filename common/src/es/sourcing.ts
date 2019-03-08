// TODO: Use protobuf?
// TODO: Find a way to skip needing to copy buffers for the methods in this class
export class ClientSentEvent {
  readonly messageId: string;
  readonly category: string;
  readonly data: ArrayBuffer; // ArrayBuffer is required by socket.io to serde properly

  constructor(messageId: string, category: string, data: Uint8Array | ArrayBuffer) {
    this.messageId = messageId;
    this.category = category;
    // This copy is done because the underlying ArrayBuffer of the data object may be larger than the actual data
    // So we need to copy it
    if (data instanceof ArrayBuffer) {
      this.data = data;
    } else {
      this.data = Uint8Array.from(data).buffer;
    }
  }

  get dataUi8(): Uint8Array {
    return new Uint8Array(this.data);
  }

  get dataBuffer(): Buffer {
    return Buffer.from(this.data);
  }
}

// TODO: Use protobuf?
// TODO: Find a way to skip needing to copy buffers for the methods in this class
export class ServerSentEvent {
  sequenceNumber: number;
  messageId: string;
  category: string;
  data: ArrayBuffer; // ArrayBuffer is required by socket.io to serde properly

  constructor(sequenceNumber: number, messageId: string, category: string, data: Uint8Array | ArrayBuffer) {
    this.sequenceNumber = sequenceNumber;
    this.messageId = messageId;
    this.category = category;
    // This copy is done because the underlying ArrayBuffer of the data object may be larger than the actual data
    // So we need to copy it
    if (data instanceof ArrayBuffer) {
      this.data = data;
    } else {
      this.data = Uint8Array.from(data).buffer;
    }
  }

  get dataUi8(): Uint8Array {
    return new Uint8Array(this.data);
  }

  get dataBuffer(): Buffer {
    return Buffer.from(this.data);
  }
}
