import localforage from 'localforage';

enum SettingsKey {
  ActiveFont = 'ActiveFont',
  RegisteredFonts = 'RegisteredFonts',
  UserProfile = 'UserProfile',
}

export type FontData = { name: string, url: string, pixelSize: number, glyphRange: number };
export type UserProfile = { username: string };

/**
 * Game settings
 */
export class GameSettings {
  private readonly store: LocalForage;

  constructor() {
    this.store = localforage.createInstance({
      name: 'rpgcore-app',
      version: 1.0,
      storeName: 'game_settings',
      description: 'Game settings',
    });
  }

  async getActiveFont() {
    return this.store.getItem<FontData>(SettingsKey.ActiveFont);
  }

  async setActiveFont(data: FontData) {
    return this.store.setItem<FontData>(SettingsKey.ActiveFont, data);
  }

  async getRegisteredFonts() {
    return this.store.getItem<FontData[]>(SettingsKey.RegisteredFonts);
  }

  async setRegisteredFonts(data: FontData[]) {
    return this.store.setItem<FontData[]>(SettingsKey.RegisteredFonts, data);
  }

  async getUserProfile() {
    return this.store.getItem<UserProfile>(SettingsKey.UserProfile);
  }

  async setUserProfile(profile: UserProfile) {
    return this.store.setItem<UserProfile>(SettingsKey.UserProfile, profile);
  }

  async clearUserProfile() {
    return this.store.removeItem(SettingsKey.UserProfile);
  }

  async onLogout() {
    await this.clearUserProfile();
  }
}
