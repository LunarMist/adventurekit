type DataBuffer = Uint8Array | ArrayBuffer | Buffer;

export class DataPack {
  readonly category: string;
  readonly version: number;
  readonly data: ArrayBuffer; // ArrayBuffer is required by socket.io to serde properly

  constructor(category: string, version: number, data: DataBuffer) {
    this.category = category;
    this.version = version;
    this.data = DataPack.toExactArrayBuffer(data);
  }

  get dataUi8(): Uint8Array {
    return new Uint8Array(this.data);
  }

  private static toExactArrayBuffer(data: DataBuffer): ArrayBuffer {
    // This copy is done because the underlying ArrayBuffer of the data object may be larger than the actual data
    // So we need to copy it
    // Order here is important, because of class hierarchy business
    if (data instanceof Buffer) {
      return Uint8Array.from(data).buffer;
    }
    if (data instanceof Uint8Array) {
      return Uint8Array.from(data).buffer;
    }
    if (data instanceof ArrayBuffer) {
      return data;
    }
    throw Error('Unknown data type');
  }
}

export class ClientSentEvent extends DataPack {
  readonly messageId: string;

  constructor(messageId: string, category: string, version: number, data: DataBuffer) {
    super(category, version, data);
    this.messageId = messageId;
  }
}

export class ServerSentEvent extends DataPack {
  readonly sequenceNumber: string;
  readonly clientMessageId: string;

  constructor(sequenceNumber: string, clientMessageId: string, category: string, version: number, data: DataBuffer) {
    super(category, version, data);
    this.sequenceNumber = sequenceNumber;
    this.clientMessageId = clientMessageId;
  }
}

export type EventAggResponse = { status: boolean; data: DataPack | null };
