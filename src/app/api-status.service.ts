// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Availability of the MEF API, reported by `apiUnavailableInterceptor`: the application displays an
 * error page instead of the current one while the API is unavailable. Reset on each navigation and
 * on `retry()`, which request the API again.
 */
@Injectable({ providedIn: 'root' })
export class ApiStatus {
  private readonly _unavailableStatus = signal<number | null>(null);

  /** HTTP status of the last failed API request (`0` without response), `null` while the API is available. */
  readonly unavailableStatus = this._unavailableStatus.asReadonly();

  /**
   * Incremented on each reset: the failures of the requests started before it (e.g. the footer
   * version, which outlives the navigations) no longer reflect the state of the API.
   */
  private _attempt = 0;

  /** Current attempt, captured when an API request starts and given back with its failure. */
  get attempt(): number {
    return this._attempt;
  }

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.retry());
  }

  /**
   * The API did not answer (`0`) or is unavailable (`502`, `503`, `504`) for a request started
   * during `attempt`; ignored when the status has been reset since.
   */
  reportUnavailable(status: number, attempt: number): void {
    if (attempt === this._attempt) {
      this._unavailableStatus.set(status);
    }
  }

  /**
   * Hides the error page: the current page is displayed again and requests the API again. Also needed
   * for a link to the current URL, which the router ignores (no navigation).
   */
  retry(): void {
    this._attempt++;
    this._unavailableStatus.set(null);
  }
}
