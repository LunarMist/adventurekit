import { UserProfile } from 'rpgcore-common/types';

import { EventAggData } from 'Event/es-data';

/**
 * For in-memory game settings
 */
export default class InMemoryGameSettings {
  public userProfile: UserProfile;
  public roomId: number;
  public aggData: EventAggData;

  constructor() {
    this.userProfile = { username: 'Anonymous' };
    this.roomId = -1;
    this.aggData = {};
  }
}
