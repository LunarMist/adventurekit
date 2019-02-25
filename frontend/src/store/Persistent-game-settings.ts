import * as LocalForage from 'localforage';
import { FontData } from 'rpgcore-common';

enum SettingsKey {
  ActiveFont = 'ActiveFont',
  RegisteredFonts = 'RegisteredFonts',
  WindowDefaultVisibility = 'WindowDefaultVisibility',
}

type WindowDefaultVisibility = { [name: string]: boolean };

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
