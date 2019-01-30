import localforage from 'localforage';
import {FontData, UserProfile} from 'rpgcore-common';

enum SettingsKey {
  ActiveFont = 'ActiveFont',
  RegisteredFonts = 'RegisteredFonts',
  UserProfile = 'UserProfile',
}


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

  async getActiveFont(): Promise<FontData | null> {
    return this.store.getItem<FontData>(SettingsKey.ActiveFont);
  }

  async setActiveFont(data: FontData): Promise<FontData> {
    return this.store.setItem<FontData>(SettingsKey.ActiveFont, data);
  }

  async getRegisteredFonts(): Promise<FontData[] | null> {
    return this.store.getItem<FontData[]>(SettingsKey.RegisteredFonts);
  }

  async setRegisteredFonts(data: FontData[]): Promise<FontData[]> {
    return this.store.setItem<FontData[]>(SettingsKey.RegisteredFonts, data);
  }

  async getUserProfile(): Promise<UserProfile | null> {
    return this.store.getItem<UserProfile>(SettingsKey.UserProfile);
  }

  async setUserProfile(profile: UserProfile): Promise<UserProfile> {
    return this.store.setItem<UserProfile>(SettingsKey.UserProfile, profile);
  }

  async clearUserProfile(): Promise<void> {
    return this.store.removeItem(SettingsKey.UserProfile);
  }

  async onLogout(): Promise<void> {
    await this.clearUserProfile();
  }
}
