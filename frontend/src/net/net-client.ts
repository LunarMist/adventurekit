export type ListenCallback = (...data: any[]) => void;

/**
 * A {@link NetClient} allows for simple event-based messages to be sent/received between the client and server.
 * Methods should be non-blocking, as calls may be made on the animation thread.
 */
export interface NetClient {
  /**
   * Open the connection.
   * Return true if the connection needed to be opened, false if it is already open.
   */
  open(): boolean;

  /**
   * Close the connection
   */
  close(): void;

  /**
   * Are we connected?
   */
  isConnected(): boolean;

  /**
   * Send a single message to the server.
   *
   * @param event The event name (identifier)
   * @param data The data to send. In general, implementations should be able to handle any serializable type given.
   * @return A promise for a possible response
   */
  sendMessage<T>(event: string, ...data: any[]): Promise<T>;

  sendSimpleMessage(event: string, ...data: any[]): void;

  /**
   * Listen to the specified event
   *
   * @param event The event name (identifier)
   * @param cb The callback
   */
  listen(event: string, cb: ListenCallback): void;
}
