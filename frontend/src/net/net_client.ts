export type ListenCallback = (...data: any[]) => void;

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
   * Send a single message to the server.
   *
   * @param event The event name (identifier)
   * @param data The data to send. In general, implementations should be able to handle any serializable type given.
   * @return A promise for a possible response
   */
  sendMessage<T>(event: string, ...data: any[]): Promise<T>;

  /**
   * Listen to the specified event
   *
   * @param event The event name (identifier)
   * @param cb The callback
   */
  listen(event: string, cb: ListenCallback): void;
}
