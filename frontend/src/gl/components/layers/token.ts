import { TokenProto } from 'rpgcore-common/es-proto';
import rbush from 'rbush';

import { RenderComponent } from 'GL/render/renderable';
import { EventAggCategories, EventCategories } from 'rpgcore-common/es';
import RBush = rbush.RBush;
import BBox = rbush.BBox;

class TokenItem implements BBox {
  token: TokenProto.Token;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor(token: TokenProto.Token) {
    this.token = token;
    this.minX = this.token.x;
    this.maxX = this.token.x + this.token.width;
    this.minY = this.token.y;
    this.maxY = this.token.y + this.token.height;
  }
}

export class TokenLayerComponent extends RenderComponent {
  private readonly rtree: RBush<TokenItem>;
  private viewport: BBox;
  private items: TokenItem[] = [];

  constructor() {
    super();
    this.rtree = rbush();
    this.viewport = { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 };
    this.refreshVisibleItems();
  }

  init(): void {
    this.es.addEventListener(EventCategories.TokenChangeEvent, dataPack => {
      const event = TokenProto.TokenChangeEvent.decode(dataPack.dataUi8);
      console.log(event);
    });
    this.es.addResyncListener(EventAggCategories.TokenSet, () => {
      console.log(this.es.aggs.tokenSet);
    });
  }

  // We cache the list of visible items
  // This makes rendering faster at the expense of memory, since a tree search is not always needed
  refreshVisibleItems(): void {
    this.items = this.rtree.search(this.viewport);
  }

  render(): void {
    this.refreshVisibleItems();
    // console.log(`Drawing ${this.items}`);
  }
}
