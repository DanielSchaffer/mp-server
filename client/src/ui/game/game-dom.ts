import { Inject, Injectable } from '@dandi/core'
import { fromEvent, map, Observable, shareReplay, startWith, throttleTime } from 'rxjs'

@Injectable()
export class GameDom {
  public readonly gameContainer: HTMLDivElement
  public readonly stage: HTMLDivElement
  public readonly viewport: HTMLDivElement
  public readonly viewportSize$: Observable<DOMRect>

  private _ready: boolean = false

  constructor(
    @Inject(Document) public readonly document: Document,
  ) {
    this.gameContainer = this.document.getElementById('game') as HTMLDivElement
    this.stage = this.document.getElementById('game__stage') as HTMLDivElement
    this.viewport = this.document.getElementById('game__viewport') as HTMLDivElement
    this.viewportSize$ = fromEvent(this.viewport.ownerDocument, 'resize').pipe(
      throttleTime(250),
      map(() => this.viewport.getBoundingClientRect()),
      startWith(this.viewport.getBoundingClientRect()),
      shareReplay(1),
    )
  }

  public init(): boolean {
    if (this._ready) {
      return false
    }

    this._ready = true
    this.stage.classList.add('game__stage--ready')
    return true
  }
}
