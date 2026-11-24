// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { ApiStatus } from '../api-status.service';
import { isApiGet } from './api-request';

/**
 * Statuses of an unavailable API: no response (`0`, server down or unreachable), or an error of the
 * gateway or of the service (`502`, `503` maintenance, `504`).
 */
const UNAVAILABLE_STATUSES = new Set([0, 502, 503, 504]);

/**
 * Reports to `ApiStatus` the API requests that fail because the API is unavailable, so that the
 * application displays an error page instead of a broken one (empty search, missing counts...).
 * The error is passed on: the other API errors (`404`, `410`...) are still handled by the pages.
 */
export const apiUnavailableInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiGet(req)) {
    return next(req);
  }
  const apiStatus = inject(ApiStatus);
  const { attempt } = apiStatus;
  return next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && UNAVAILABLE_STATUSES.has(error.status)) {
          apiStatus.reportUnavailable(error.status, attempt);
        }
      },
    }),
  );
};
