// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, RESPONSE_INIT } from '@angular/core';
import { tap } from 'rxjs';

/** API statuses passed on to the page: the record doesn't exist (`404`) or no longer exists (`410`). */
const PAGE_STATUSES = new Set([404, 410]);

/**
 * Server rendering: gives the page the `404` or `410` status of a failed API request (e.g. the
 * detail view of an unknown PID), so that the search engines don't index the error page.
 * No effect in the browser, where `RESPONSE_INIT` is not provided.
 */
export const responseStatusInterceptor: HttpInterceptorFn = (req, next) => {
  const response = inject(RESPONSE_INIT, { optional: true });
  if (!response) {
    return next(req);
  }
  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && PAGE_STATUSES.has(error.status)) {
          response.status = error.status;
        }
      },
    }),
  );
};
