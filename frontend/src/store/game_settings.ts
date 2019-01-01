import * as localforage from "localforage";

enum SettingsKey {
  ActiveFont = "ActiveFont",
  RegisteredFonts = "RegisteredFonts"
}

export type FontData = { name: string, url: string, pixelSize: number, glyphRange: number };

/**
 * Game settings
 */
export class GameSettings implements GameSettings {
  constructor() {
    localforage.config({
      name: 'rpgcore-app',
      version: 1.0,
      storeName: 'game_settings',
      description: 'Game settings'
    });
  }

  getActiveFont(): Promise<FontData | null> {
    return localforage.getItem<FontData | null>(SettingsKey.ActiveFont);
  }

  setActiveFont(data: FontData): Promise<FontData> {
    return localforage.setItem<FontData>(SettingsKey.ActiveFont, data);
  }

  getRegisteredFonts(): Promise<FontData[] | null> {
    return localforage.getItem<FontData[] | null>(SettingsKey.RegisteredFonts);
  }

  setRegisteredFonts(data: FontData[]): Promise<FontData[]> {
    return localforage.setItem(SettingsKey.RegisteredFonts, data);
  }
}
