import PubSub from 'pubsub-js';

enum TopicKeys {
  FontRebuildRequired = 'FontRebuildRequired',
}

/**
 * Pubsub for game-related message
 */
export class GameMessagesBroker {
  sendFontRebuildRequiredRequest(): boolean {
    return PubSub.publishSync(TopicKeys.FontRebuildRequired, true);
  }

  listenFontRebuildRequiredRequest(cb: (required: boolean) => void): any {
    return PubSub.subscribe(TopicKeys.FontRebuildRequired, cb);
  }
}
