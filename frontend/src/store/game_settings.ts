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

  getActiveFont(): Promise<FontData | null> {
    return this.store.getItem(SettingsKey.ActiveFont);
  }

  setActiveFont(data: FontData): Promise<FontData> {
    return this.store.setItem(SettingsKey.ActiveFont, data);
  }

  getRegisteredFonts(): Promise<FontData[] | null> {
    return this.store.getItem(SettingsKey.RegisteredFonts);
  }

  setRegisteredFonts(data: FontData[]): Promise<FontData[]> {
    return this.store.setItem(SettingsKey.RegisteredFonts, data);
  }

  getUserProfile(): Promise<UserProfile | null> {
    return this.store.getItem(SettingsKey.UserProfile);
  }

  setUserProfile(profile: UserProfile): Promise<UserProfile> {
    return this.store.setItem(SettingsKey.UserProfile, profile);
  }
}
