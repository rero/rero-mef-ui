// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { ApplicationRef, inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { of, tap } from 'rxjs';

import { isApiGet } from './api-request';

/** API response transferred from the server to the browser with the page. */
interface TransferredResponse {
  body: unknown;
  status: number;
  url: string;
}

/** Reads the transferred responses only during the hydration, as the HTTP transfer cache of Angular. */
@Injectable({ providedIn: 'root' })
export class ApiTransferCache {
  active = true;

  constructor() {
    inject(ApplicationRef)
      .whenStable()
      .then(() => (this.active = false));
  }
}

/**
 * Transfers the API responses of the server rendering to the browser, which displays the page
 * without requesting the API again.
 *
 * Replaces the HTTP transfer cache of Angular (`withNoHttpTransferCache()`), which never stores the
 * API responses: they are requested with `cache: 'no-store'` (`noCacheInterceptor`), and answered
 * with `Cache-Control: private` or `no-cache` and a load balancer cookie (`Set-Cookie`).
 * First interceptor: the stored body is the one the application receives, after the other interceptors.
 */
export const apiTransferCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiGet(req) || req.responseType !== 'json') {
    return next(req);
  }
  const transferState = inject(TransferState);
  const key = makeStateKey<TransferredResponse>(`api:${req.urlWithParams}`);

  if (isPlatformServer(inject(PLATFORM_ID))) {
    return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const { body, status, url } = event;
          transferState.set(key, { body, status, url: url ?? req.urlWithParams });
        }
      }),
    );
  }
  const transferred = inject(ApiTransferCache).active ? transferState.get(key, null) : null;
  return transferred ? of(new HttpResponse(transferred)) : next(req);
};
