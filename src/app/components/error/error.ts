// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, computed, inject, RESPONSE_INIT } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  imports: [RouterLink],
  templateUrl: './error.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error {
  private readonly data = toSignal(inject(ActivatedRoute).data, { requireSync: true });

  /** HTTP status code defined in the route data. */
  readonly status = computed(() => this.data()['status'] as number);
  /** Error description defined in the route data. */
  readonly description = computed(() => this.data()['description'] as string);

  constructor() {
    // Server rendering: HTTP status of the response, so that the search engines don't index the page
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) {
      response.status = this.status();
    }
  }
}
