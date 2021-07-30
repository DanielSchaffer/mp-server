import { Inject, Injectable } from '@dandi/core'

@Injectable()
export class GameDom {
  public readonly gameContainer: HTMLDivElement
  public readonly viewport: HTMLDivElement
  public readonly stage: HTMLDivElement
  public readonly canvas: HTMLElement

  constructor(
    @Inject(Document) public readonly document: Document,
  ) {
    this.gameContainer = this.document.getElementById('game') as HTMLDivElement
    this.viewport = this.document.getElementById('game__viewport') as HTMLDivElement
    this.stage = this.document.getElementById('game__stage') as HTMLDivElement
    this.canvas = this.document.getElementById('game__canvas') as HTMLDivElement
  }
}
