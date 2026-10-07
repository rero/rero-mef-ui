// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpInterceptorFn } from '@angular/common/http';

import { isApiGet } from './api-request';

/**
 * Bypasses the browser HTTP cache for the API GET requests (`cache: 'no-store'`).
 *
 * The API returns `Cache-Control: no-cache` with the MEF record revision as `ETag`, also for
 * `?resolve=1` (detail view): when only an embedded source changes, the server answers
 * `304 Not Modified` to the conditional request of the browser, which displays the old sources.
 * With `no-store`, the browser never sends a conditional request.
 * Can be removed when the API `ETag` takes the resolved sources into account.
 *
 * Requires the fetch backend (`withFetch()`): the XHR backend ignores the `cache` option.
 */
export const noCacheInterceptor: HttpInterceptorFn = (req, next) =>
  next(isApiGet(req) ? req.clone({ cache: 'no-store' }) : req);
