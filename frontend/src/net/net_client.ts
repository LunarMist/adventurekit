export type AckCallback = ((data: any) => void) | null;
export type ListenCallback = (data: any) => void;

/**
 * A {@link NetClient} allows for simple event-based messages to be sent/received between the client and server.
 * Methods should be non-blocking, as calls may be made on the animation thread.
 */
export interface NetClient {
  /**
   * Open the connection
   */
  open(): void;

  /**
   * Close the connection
   */
  close(): void;

  /**
   * Send a single message to the server
   *
   * @param event The event name (identifier)
   * @param data The data to send. In general, implementations should be able to handle any serializable type given.
   * @param ack (optional) A callback indicating that the server received the message sent
   */
  sendMessage(event: number | string, data: any, ack: AckCallback): boolean;

  /**
   * Listen to the specified event
   *
   * @param event The event name (identifier)
   * @param cb The callback
   */
  listen(event: number | string, cb: ListenCallback): boolean;
}
