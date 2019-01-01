import {SimpleRenderComponent} from "GL/render";
import * as ImGui from "ImGui/imgui";
import {ImGuiWindowFlags, ImVec2} from "ImGui/imgui";

export class AboutComponent extends SimpleRenderComponent {
  private showLicensesWindow: boolean = false;

  render(): void {
    /**
     * About window
     */
    ImGui.SetNextWindowPos(new ImVec2(500, 100), ImGui.Cond.FirstUseEver);
    ImGui.Begin("About", null, ImGuiWindowFlags.AlwaysAutoResize);

    if (ImGui.Button("View on github! (must allow popups)")) {
      window.open('https://github.com/LunarMist/rpgcore', '_blank');
    }

    if (ImGui.Button("View licenses")) {
      this.showLicensesWindow = true;
    }

    ImGui.Text("Email: jeremy@adventurekit.app");
    ImGui.Text("Copyright (c) Jeremy Simpson 2018");
    ImGui.End();

    /**
     * Licenses window
     */
    if (this.showLicensesWindow) {
      ImGui.SetNextWindowSize(new ImVec2(600, 700));
      ImGui.Begin("Licenses", (value = this.showLicensesWindow) => this.showLicensesWindow = value, ImGuiWindowFlags.NoResize);

      for (let l in this.licenses) {
        if (ImGui.CollapsingHeader(l)) {
          ImGui.Text(this.licenses[l]);
        }
      }

      ImGui.End();
    }
  }

  private readonly licenses: { [key: string]: string } = {
    "Dear ImGui": "https://github.com/ocornut/imgui\n" +
      "\n" +
      "The MIT License (MIT)\n" +
      "\n" +
      "Copyright (c) 2014-2018 Omar Cornut\n" +
      "\n" +
      "Permission is hereby granted, free of charge, to any person obtaining a copy\n" +
      "of this software and associated documentation files (the \"Software\"), to deal\n" +
      "in the Software without restriction, including without limitation the rights\n" +
      "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n" +
      "copies of the Software, and to permit persons to whom the Software is\n" +
      "furnished to do so, subject to the following conditions:\n" +
      "\n" +
      "The above copyright notice and this permission notice shall be included in all\n" +
      "copies or substantial portions of the Software.\n" +
      "\n" +
      "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n" +
      "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n" +
      "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n" +
      "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n" +
      "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n" +
      "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n" +
      "SOFTWARE.",

    "ImGui-js": "https://github.com/flyover/imgui-js\n" +
      "\n" +
      "The MIT License (MIT)\n" +
      "\n" +
      "Copyright (c) 2018 Flyover Games, LLC\n" +
      "\n" +
      "Permission is hereby granted, free of charge, to any person obtaining a copy\n" +
      "of this software and associated documentation files (the \"Software\"), to deal\n" +
      "in the Software without restriction, including without limitation the rights\n" +
      "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n" +
      "copies of the Software, and to permit persons to whom the Software is\n" +
      "furnished to do so, subject to the following conditions:\n" +
      "\n" +
      "The above copyright notice and this permission notice shall be included in all\n" +
      "copies or substantial portions of the Software.\n" +
      "\n" +
      "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n" +
      "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n" +
      "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n" +
      "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n" +
      "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n" +
      "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n" +
      "SOFTWARE.",

    "Game-icons": "https://game-icons.net/\n" +
      "\n" +
      "Icons provided under the Creative Commons 3.0 BY or CC0 if mentioned below.\n" +
      "\n" +
      "Each sub-folders in this archive correspond to a different contributor :\n" +
      "\n" +
      "- Lorc, http://lorcblog.blogspot.com\n" +
      "- Delapouite, http://delapouite.com\n" +
      "- John Colburn, http://ninmunanmu.com\n" +
      "- Felbrigg, http://blackdogofdoom.blogspot.co.uk\n" +
      "- John Redman, http://www.uniquedicetowers.com\n" +
      "- Carl Olsen, https://twitter.com/unstoppableCarl\n" +
      "- Sbed, http://opengameart.org/content/95-game-icons\n" +
      "- PriorBlue\n" +
      "- Willdabeast, http://wjbstories.blogspot.com\n" +
      "- Viscious Speed, http://viscious-speed.deviantart.com - CC0\n" +
      "- Lord Berandas, http://berandas.deviantart.com\n" +
      "- Irongamer, http://ecesisllc.wix.com/home\n" +
      "- HeavenlyDog, http://www.gnomosygoblins.blogspot.com\n" +
      "- Lucas\n" +
      "- Faithtoken, http://fungustoken.deviantart.com\n" +
      "- Skoll\n" +
      "- Andy Meneely, http://www.se.rit.edu/~andy/\n" +
      "- Cathelineau\n" +
      "- Kier Heyl\n" +
      "- Aussiesim\n" +
      "- Sparker, http://citizenparker.com\n" +
      "- Zeromancer - CC0\n" +
      "- Rihlsul\n" +
      "- Quoting\n" +
      "- Guard13007, https://guard13007.com\n" +
      "- DarkZaitzev, http://darkzaitzev.deviantart.com\n" +
      "- SpencerDub\n" +
      "- GeneralAce135\n" +
      "- Zajkonur\n" +
      "\n" +
      "Please, include a mention \"Icons made by {author}\" in your derivative work.\n" +
      "\n" +
      "If you use them in one of your project, don't hesitate to drop a message to delapouite@gmail.com or ping @GameIcons on twitter.\n" +
      "\n" +
      "More info and icons available at https://game-icons.net\n",

    "Google Noto Fonts": "This Font Software is licensed under the SIL Open Font License,\n" +
      "Version 1.1.\n" +
      "\n" +
      "This license is copied below, and is also available with a FAQ at:\n" +
      "http://scripts.sil.org/OFL\n" +
      "\n" +
      "-----------------------------------------------------------\n" +
      "SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n" +
      "-----------------------------------------------------------\n" +
      "\n" +
      "PREAMBLE\n" +
      "The goals of the Open Font License (OFL) are to stimulate worldwide\n" +
      "development of collaborative font projects, to support the font\n" +
      "creation efforts of academic and linguistic communities, and to\n" +
      "provide a free and open framework in which fonts may be shared and\n" +
      "improved in partnership with others.\n" +
      "\n" +
      "The OFL allows the licensed fonts to be used, studied, modified and\n" +
      "redistributed freely as long as they are not sold by themselves. The\n" +
      "fonts, including any derivative works, can be bundled, embedded,\n" +
      "redistributed and/or sold with any software provided that any reserved\n" +
      "names are not used by derivative works. The fonts and derivatives,\n" +
      "however, cannot be released under any other type of license. The\n" +
      "requirement for fonts to remain under this license does not apply to\n" +
      "any document created using the fonts or their derivatives.\n" +
      "\n" +
      "DEFINITIONS\n" +
      "\"Font Software\" refers to the set of files released by the Copyright\n" +
      "Holder(s) under this license and clearly marked as such. This may\n" +
      "include source files, build scripts and documentation.\n" +
      "\n" +
      "\"Reserved Font Name\" refers to any names specified as such after the\n" +
      "copyright statement(s).\n" +
      "\n" +
      "\"Original Version\" refers to the collection of Font Software\n" +
      "components as distributed by the Copyright Holder(s).\n" +
      "\n" +
      "\"Modified Version\" refers to any derivative made by adding to,\n" +
      "deleting, or substituting -- in part or in whole -- any of the\n" +
      "components of the Original Version, by changing formats or by porting\n" +
      "the Font Software to a new environment.\n" +
      "\n" +
      "\"Author\" refers to any designer, engineer, programmer, technical\n" +
      "writer or other person who contributed to the Font Software.\n" +
      "\n" +
      "PERMISSION & CONDITIONS\n" +
      "Permission is hereby granted, free of charge, to any person obtaining\n" +
      "a copy of the Font Software, to use, study, copy, merge, embed,\n" +
      "modify, redistribute, and sell modified and unmodified copies of the\n" +
      "Font Software, subject to the following conditions:\n" +
      "\n" +
      "1) Neither the Font Software nor any of its individual components, in\n" +
      "Original or Modified Versions, may be sold by itself.\n" +
      "\n" +
      "2) Original or Modified Versions of the Font Software may be bundled,\n" +
      "redistributed and/or sold with any software, provided that each copy\n" +
      "contains the above copyright notice and this license. These can be\n" +
      "included either as stand-alone text files, human-readable headers or\n" +
      "in the appropriate machine-readable metadata fields within text or\n" +
      "binary files as long as those fields can be easily viewed by the user.\n" +
      "\n" +
      "3) No Modified Version of the Font Software may use the Reserved Font\n" +
      "Name(s) unless explicit written permission is granted by the\n" +
      "corresponding Copyright Holder. This restriction only applies to the\n" +
      "primary font name as presented to the users.\n" +
      "\n" +
      "4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\n" +
      "Software shall not be used to promote, endorse or advertise any\n" +
      "Modified Version, except to acknowledge the contribution(s) of the\n" +
      "Copyright Holder(s) and the Author(s) or with their explicit written\n" +
      "permission.\n" +
      "\n" +
      "5) The Font Software, modified or unmodified, in part or in whole,\n" +
      "must be distributed entirely under this license, and must not be\n" +
      "distributed under any other license. The requirement for fonts to\n" +
      "remain under this license does not apply to any document created using\n" +
      "the Font Software.\n" +
      "\n" +
      "TERMINATION\n" +
      "This license becomes null and void if any of the above conditions are\n" +
      "not met.\n" +
      "\n" +
      "DISCLAIMER\n" +
      "THE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\n" +
      "EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\n" +
      "MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\n" +
      "OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\n" +
      "COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\n" +
      "INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\n" +
      "DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n" +
      "FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\n" +
      "OTHER DEALINGS IN THE FONT SOFTWARE.\n"
  };
}
