import { Disposable } from '@dandi/common'
import { EntryPoint, Inject, Injectable, Logger } from '@dandi/core'
import { catchError, merge, NEVER, Observable, Subscription, throwError } from 'rxjs'

import { WebSocketService } from './web-socket-service'

interface ServiceError {
  error: Error
  service: WebSocketService
}

function isServiceError(obj: unknown): obj is ServiceError {
  return (
    obj.hasOwnProperty('error') &&
    obj.hasOwnProperty('service') &&
    (obj as any).error instanceof Error &&
    typeof (obj as any).service === 'object'
  )
}

@Injectable(EntryPoint)
export class WebSocketServiceManager implements EntryPoint, Disposable {
  protected readonly run$: Observable<never>

  private readonly sub = new Subscription()

  constructor(
    @Inject(WebSocketService) private readonly services: WebSocketService[],
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.run$ = merge(
      ...services.map((service) =>
        service.run$.pipe(
          // catch per-service errors and rethrow with a reference to the service
          // this allows the service to be included for logging, but also ensures the service's observable is completed
          catchError((err) =>
            throwError(() => ({
              service,
              err,
            })),
          ),
        ),
      ),
    ).pipe(
      catchError((err) => {
        if (isServiceError(err)) {
          // eat and log per-service errors to prevent individual services from breaking other services
          this.logger.error(`Error in service ${err.service.name}:`, err)
          return NEVER
        }
        return throwError(err)
      }),
    )
  }

  public run(): void {
    this.sub.add(
      this.run$
        .pipe(
          catchError((err) => {
            this.logger.error('Unhandled error', err)
            return NEVER
          }),
        )
        .subscribe(),
    )
  }

  public dispose(reason: string): void | Promise<void> {
    this.sub.unsubscribe()
  }
}
