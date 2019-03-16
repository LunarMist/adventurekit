import { UserProfile } from 'rpgcore-common/types';

/**
 * For in-memory shared storage
 */
export default class InMemorySharedStore {
  public userProfile: UserProfile;
  public roomId: number;

  constructor() {
    this.userProfile = { username: 'Anonymous' };
    this.roomId = -1;
  }
}
