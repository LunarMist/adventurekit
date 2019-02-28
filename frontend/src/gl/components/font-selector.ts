import { FontData } from 'rpgcore-common';

import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';
import * as ImGui from 'ImGui/imgui';
import { RegisteredFonts } from 'Store/Persistent-game-settings';
import { FontRebuildRequiredEvent } from 'IO/event';

export const DEFAULT_ACTIVE_FONT = {
  name: 'NotoSans-Regular',
  url: require('Fonts/NotoSans-Regular.ttf'),
  pixelSize: 16.0,
  glyphRange: 120712, // Taken from ImGui itself. TODO: Find a better way than doing this.
};

export class FontSelectorComponent extends WindowRenderComponent {
  protected windowId: WindowId = WindowId.Font;

  protected fontsAvailable: RegisteredFonts = {};

  private fontListItems: string[] = [];
  private selectedFont: string = DEFAULT_ACTIVE_FONT.name;

  private readonly nameBuffer = new ImGui.ImStringBuffer(75, '');
  private readonly urlBuffer = new ImGui.ImStringBuffer(300, '');
  private readonly pixelSizeBuffer = new ImGui.ImStringBuffer(5, '16');
  private selectedGlyphRange: string = 'Default (Basic Latin, Extended Latin)';

  private GLYPH_RANGES: { [name: string]: number } = {};

  private readonly TEXT_SUCCESS_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TEXT_ERROR_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = '';
  private successString = '';

  init(): void {
    this.store.p.getRegisteredFonts()
      .then(f => {
        if (f === null) {
          this.addBuiltInFonts();
        } else {
          this.fontsAvailable = f;
        }

        for (const key in this.fontsAvailable) {
          this.fontListItems.push(key);
        }
        this.fontListItems.sort();
      })
      .catch(console.error);

    this.store.p.getActiveFont()
      .then(f => {
        if (f !== null) {
          this.selectedFont = f.name;
        }
      })
      .catch(console.error);

    const io = ImGui.GetIO();

    this.GLYPH_RANGES = {
      'Default (Basic Latin, Extended Latin)': io.Fonts.GetGlyphRangesDefault(),
      'Korean (Default + Korean)': io.Fonts.GetGlyphRangesKorean(),
      'Japanese (Default + Hiragana, Katakana, Half-Width)': io.Fonts.GetGlyphRangesJapanese(),
      'ChineseFull (Default + 21000 CJK)': io.Fonts.GetGlyphRangesChineseFull(),
      'ChineseSimple (Default + 2500 CJK)': io.Fonts.GetGlyphRangesChineseSimplifiedCommon(),
      'Cyrillic (Default + Cyrillic)': io.Fonts.GetGlyphRangesCyrillic(),
      'Thai (Default + Thai)': io.Fonts.GetGlyphRangesThai(),
    };
  }

  render(): void {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Fonts', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.BeginCombo('Available Fonts', this.selectedFont, 0)) {
      for (const item of this.fontListItems) {
        const isSelected = this.selectedFont === item;
        if (ImGui.Selectable(item, isSelected)) {
          this.selectedFont = item;
          this.loadFont(this.fontsAvailable[this.selectedFont]);
        }
        if (isSelected) {
          ImGui.SetItemDefaultFocus();
        }
      }
      ImGui.EndCombo();
    }

    ImGui.Separator();

    ImGui.InputText('Name', this.nameBuffer, this.nameBuffer.size, ImGui.ImGuiInputTextFlags.CharsNoBlank);
    ImGui.InputText('Url', this.urlBuffer, this.urlBuffer.size, ImGui.ImGuiInputTextFlags.CharsNoBlank);
    ImGui.InputText('Pixel Size', this.pixelSizeBuffer, this.pixelSizeBuffer.size, ImGui.ImGuiInputTextFlags.CharsDecimal);
    if (ImGui.BeginCombo('Glyph Range', this.selectedGlyphRange, 0)) {
      for (const item in this.GLYPH_RANGES) {
        const isSelected = this.selectedGlyphRange === item;
        if (ImGui.Selectable(item, isSelected)) {
          this.selectedGlyphRange = item;
        }
        if (isSelected) {
          ImGui.SetItemDefaultFocus();
        }
      }
      ImGui.EndCombo();
    }

    if (ImGui.Button('Add Font')) {
      // Reset messages
      this.errorString = '';
      this.successString = '';

      if (!this.nameBuffer.buffer || !this.urlBuffer.buffer || !this.pixelSizeBuffer.buffer) {
        this.errorString = 'Name, Url and pixel size must be set';
      } else if (this.nameBuffer.buffer in this.fontsAvailable) {
        this.errorString = 'Named font already exists. Please use another name.';
      } else {
        const newFont: FontData = {
          name: this.nameBuffer.buffer,
          url: this.urlBuffer.buffer,
          pixelSize: Number(this.pixelSizeBuffer.buffer),
          glyphRange: this.GLYPH_RANGES[this.selectedGlyphRange],
        };
        FontSelectorComponent.fetchAndRegisterFont(newFont)
          .then(f => {
            ImGui.GetIO().FontDefault = f;
            this.requestFontRebuild();
            this.fontsAvailable[newFont.name] = newFont;
            this.fontListItems.push(newFont.name);
            this.fontListItems.sort();
            this.selectedFont = newFont.name;
            return this.store.p.setRegisteredFonts(this.fontsAvailable);
          })
          .then(f => {
            this.successString = 'Success!';
            return this.store.p.setActiveFont(newFont);
          })
          .catch(e => {
            this.errorString = e.toString();
          });
      }
    }

    if (this.successString.length > 0) {
      ImGui.TextColored(this.TEXT_SUCCESS_COLOR, this.successString);
    }

    if (this.errorString.length > 0) {
      ImGui.TextColored(this.TEXT_ERROR_COLOR, this.errorString);
    }

    ImGui.End();
  }

  public static async fetchAndRegisterFont(font: FontData): Promise<ImGui.ImFont> {
    console.log(`Loading font ${font.name} at ${font.url}`);
    const resp: Response = await fetch(font.url);
    if (!resp.ok) {
      throw Error(`Could not load font from url; ${resp.statusText}`);
    }
    const fontBuffer: ArrayBuffer = await resp.arrayBuffer();
    const fontConfig = new ImGui.ImFontConfig();
    fontConfig.Name = font.name;
    return ImGui.GetIO().Fonts.AddFontFromMemoryTTF(fontBuffer, font.pixelSize, fontConfig, font.glyphRange);
  }

  private loadFont(fontItem: FontData) {
    let foundFont: ImGui.ImFont | null = null;

    ImGui.GetIO().Fonts.Fonts.forEach(f => {
      if (f.GetDebugName() === fontItem.name) {
        foundFont = f;
      }
    });

    if (foundFont !== null) {
      ImGui.GetIO().FontDefault = foundFont;
      this.store.p.setActiveFont(fontItem)
        .catch(console.error);
    } else {
      FontSelectorComponent.fetchAndRegisterFont(fontItem)
        .then(f => {
          ImGui.GetIO().FontDefault = f;
          this.requestFontRebuild();
          return this.store.p.setActiveFont(fontItem);
        })
        .catch(console.error);
    }
  }

  private addBuiltInFonts() {
    const BUILT_IN_FONTS: { [name: string]: FontData } = {
      'NotoSans-Regular': {
        name: 'NotoSans-Regular',
        url: require('Fonts/NotoSans-Regular.ttf'),
        pixelSize: 16.0,
        glyphRange: ImGui.GetIO().Fonts.GetGlyphRangesDefault(),
      },
      'NotoSansCJK-Regular': {
        name: 'NotoSansCJK-Regular',
        url: require('Fonts/NotoSansCJK-Regular.ttc'),
        pixelSize: 16.0,
        glyphRange: ImGui.GetIO().Fonts.GetGlyphRangesChineseFull(),
      },
      'NotoMono-Regular': {
        name: 'NotoMono-Regular',
        url: require('Fonts/NotoMono-Regular.ttf'),
        pixelSize: 16.0,
        glyphRange: ImGui.GetIO().Fonts.GetGlyphRangesDefault(),
      },
      'Roboto-Regular': {
        name: 'Roboto-Regular',
        url: require('Fonts/Roboto-Regular.ttf'),
        pixelSize: 16.0,
        glyphRange: ImGui.GetIO().Fonts.GetGlyphRangesDefault(),
      },
      'Sweet16mono': {
        name: 'Sweet16mono',
        url: require('Fonts/Sweet16mono.ttf'),
        pixelSize: 16.0,
        glyphRange: ImGui.GetIO().Fonts.GetGlyphRangesDefault(),
      },
    };

    for (const key in BUILT_IN_FONTS) {
      this.fontsAvailable[key] = { ...BUILT_IN_FONTS[key] };
    }
    this.store.p.setRegisteredFonts(this.fontsAvailable)
      .catch(console.error);
  }

  private requestFontRebuild() {
    this.io.dispatcher.queueEvent(new FontRebuildRequiredEvent());
  }
}
