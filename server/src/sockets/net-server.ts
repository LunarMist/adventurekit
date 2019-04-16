/**
 * A {@link NetServer} is responsible for handling connection requests and creating {@link NetServerSocket} instances
 */
export interface NetServer {
  serve(): void;
}

/**
 * Generic callback type
 */
export type ListenCallback = (...data: any[]) => void;

/**
 * A {@link NetServerSocket} allows for simple event-based messages to be sent/received between the server and client
 * Methods should be non-blocking
 */
export interface NetServerSocket {
  /**
   * Get the current socket id
   * The socket id should be unique among all sockets.
   */
  readonly socketId: string;

  /**
   * Send a single message to the client.
   *
   * @param event The event name (identifier)
   * @param data The data to send. In general, implementations should be able to handle any serializable type given
   * @return A promise for a possible response
   */
  sendMessage<T>(event: string, ...data: any[]): Promise<T>;

  sendSimpleMessage(event: string, ...data: any[]): void;

  /**
   * Send a message to a named group of recipients
   * @param event The event name (identifier)
   * @param group The group name (identifier)
   * @param data The data to send. In general, implementations should be able to handle any serializable type given
   */
  sendGroupMessage(event: string, group: string, ...data: any[]): void;

  /**
   * Leave the group
   * @param group The group name
   */
  leaveGroup(group: string): void;

  /**
   * Join the group
   * @param group The group name
   */
  joinGroup(group: string): void;

  /**
   * List the groups this user belongs to
   */
  readonly groups: string[];

  /**
   * Listen to the specified event
   *
   * @param event The event name (identifier)
   * @param cb The callback
   */
  listen(event: string, cb: ListenCallback): void;

  /**
   * Disconnect the client
   */
  disconnect(): void;
}

/**
 * An authenticated version of {@link NetServerSocket}
 */
export interface AuthenticatedNetServerSocket extends NetServerSocket {
  /**
   * Special: We must support an authenticated listener
   */
  listenAuthenticated(event: string, cb: ListenCallback): void;
}
