import {UserProfile} from 'rpgcore-common';

export default class InMemoryGameSettings {
  public userProfile: UserProfile;
  public roomId: number;

  constructor() {
    this.userProfile = {username: "Anonymous"};
    this.roomId = -1;
  }

  onLogout() {
    this.userProfile = {username: "Anonymous"};
    this.roomId = -1;
  }
}
