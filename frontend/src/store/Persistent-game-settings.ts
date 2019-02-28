import * as LocalForage from 'localforage';
import { FontData } from 'rpgcore-common';

enum SettingsKey {
  ActiveFont = 'ActiveFont',
  RegisteredFonts = 'RegisteredFonts',
  WindowDefaultVisibility = 'WindowDefaultVisibility',
}

export type WindowDefaultVisibility = { [name: string]: boolean };
export type RegisteredFonts = { [name: string]: FontData };

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

  async getRegisteredFonts(): Promise<RegisteredFonts | null> {
    return this.store.getItem<RegisteredFonts>(SettingsKey.RegisteredFonts);
  }

  async setRegisteredFonts(data: RegisteredFonts): Promise<RegisteredFonts> {
    return this.store.setItem<RegisteredFonts>(SettingsKey.RegisteredFonts, data);
  }

  async setWindowDefaultVisibility(windowId: string, state: boolean): Promise<void> {
    let currVisibility = await this.store.getItem<WindowDefaultVisibility>(SettingsKey.WindowDefaultVisibility);
    if (currVisibility === null) {
      currVisibility = {};
    }
    currVisibility[windowId] = state;
    await this.store.setItem<WindowDefaultVisibility>(SettingsKey.WindowDefaultVisibility, currVisibility);
  }

  async getWindowDefaultVisibility(windowId: string, defaultState: boolean = false): Promise<boolean> {
    let currVisibility = await this.store.getItem<WindowDefaultVisibility>(SettingsKey.WindowDefaultVisibility);
    if (currVisibility === null) {
      currVisibility = {};
      currVisibility[windowId] = defaultState;
      await this.store.setItem<WindowDefaultVisibility>(SettingsKey.WindowDefaultVisibility, currVisibility);
    }
    if (!(windowId in currVisibility)) {
      currVisibility[windowId] = defaultState;
      await this.store.setItem<WindowDefaultVisibility>(SettingsKey.WindowDefaultVisibility, currVisibility);
    }
    return currVisibility[windowId];
  }
}
