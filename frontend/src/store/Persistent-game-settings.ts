import * as LocalForage from 'localforage';
import { FontData } from 'rpgcore-common';

enum SettingsKey {
  ActiveFont = 'ActiveFont',
  RegisteredFonts = 'RegisteredFonts',
}

/**
 * Persistent Game settings
 */
export default class PersistentGameSettings {
  private readonly store: LocalForage;

  constructor() {
    this.store = LocalForage.createInstance({
      name: 'rpgcore-app',
      version: 1.0,
      storeName: 'game-settings',
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
}
