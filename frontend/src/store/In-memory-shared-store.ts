import { UserProfile } from 'rpgcore-common/types';

import { EventAggData } from 'Event/es-data';

/**
 * For in-memory shared storage
 */
export default class InMemorySharedStore {
  public userProfile: UserProfile;
  public roomId: number;
  public aggData: EventAggData;

  constructor() {
    this.userProfile = { username: 'Anonymous' };
    this.roomId = -1;
    this.aggData = {};
  }
}
