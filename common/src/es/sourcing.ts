// TODO: Use protobuf
export type ClientSentEvent = {
  messageId: string;
  category: string;
  data: ArrayBuffer;
};

export type ServerSentEvent = {
  sequenceNumber: number;
  messageId: string;
  category: string;
  data: ArrayBuffer;
};
