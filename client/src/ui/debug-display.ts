import { Inject, Injectable } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { isPoint, Point } from '@mp-server/shared'
import { Observable, tap } from 'rxjs'

import { Avatar } from './avatar'

@Injectable()
export class DebugDisplay {
  protected readonly clientId: HTMLDivElement
  protected readonly container: HTMLDivElement
  protected readonly velocity: HTMLDivElement
  protected readonly acceleration: HTMLDivElement
  protected readonly orientation: HTMLDivElement
  protected readonly rotation: HTMLDivElement
  protected readonly location: HTMLDivElement

  constructor(@Inject(Document) protected readonly document: Document) {
    this.container = document.getElementById('debug') as HTMLDivElement
    this.clientId = this.getComponentContainer('debug__client-id')
    this.velocity = this.getComponentContainer('debug__velocity')
    this.acceleration = this.getComponentContainer('debug__acceleration')
    this.orientation = this.getComponentContainer('debug__orientation')
    this.rotation = this.getComponentContainer('debug__rotation')
    this.location = this.getComponentContainer('debug__location')
  }

  public bind(avatar$: Observable<Avatar>): Observable<never> {
    return avatar$.pipe(
      tap((avatar) => {
        const { acceleration, velocity } = avatar.transform.movement
        const { location, orientation } = avatar.transform.position
        const { rate } = avatar.transform.rotation
        this.updateComponent(this.clientId, avatar.entityId)
        this.updateComponent(this.velocity, `${Point.absTotal(velocity).toFixed(2)}m/s`)
        this.updateComponent(this.acceleration, `${Point.absTotal(acceleration).toFixed(2)}m/s/s`)
        this.updateComponent(this.orientation, `${orientation.y.toFixed(2)}º`)
        this.updateComponent(this.rotation, `${rate.y.toFixed(2)}º/s`)
        this.updateComponent(this.location, location)
      }),
      silence(),
    )
  }

  private getComponentContainer(name: string, container?: HTMLDivElement): HTMLDivElement {
    return (container ?? this.container).getElementsByClassName(name)[0] as HTMLDivElement
  }

  private updateComponent(container: HTMLDivElement, value: unknown): void {
    const valueEl = container.lastElementChild as HTMLDivElement
    if (isPoint(value)) {
      this.updateComponent(this.getComponentContainer('x', valueEl), value.x.toFixed(2))
      this.updateComponent(this.getComponentContainer('y', valueEl), value.y.toFixed(2))
      this.updateComponent(this.getComponentContainer('z', valueEl), value.z.toFixed(2))
    } else {
      valueEl.textContent = value?.toString()
    }
  }
}
