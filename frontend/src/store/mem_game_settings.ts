import {UserProfile} from 'rpgcore-common';

export default class InMemoryGameSettings {
  public userProfile: UserProfile | null = null;

  onLogout() {
    this.userProfile = null;
  }
}
