import { UserProfile } from 'rpgcore-common/types';

/**
 * For in-memory game settings
 */
export default class InMemoryGameSettings {
  public userProfile: UserProfile;
  public roomId: number;

  constructor() {
    this.userProfile = { username: 'Anonymous' };
    this.roomId = -1;
  }
}
