// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApiStatus } from '../api-status.service';
import { apiUnavailableInterceptor } from './api-unavailable.interceptor';

describe('apiUnavailableInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let apiStatus: ApiStatus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiUnavailableInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    apiStatus = TestBed.inject(ApiStatus);
  });

  afterEach(() => backend.verify());

  function fail(url: string, status: number): unknown {
    let received: unknown;
    http.get(url).subscribe({ error: (error: unknown) => (received = error) });
    const req = backend.expectOne(url);
    if (status === 0) {
      req.error(new ProgressEvent('error'));
    } else {
      req.flush(null, { status, statusText: 'Error' });
    }
    return received;
  }

  it.each([0, 502, 503, 504])('should report the unavailable API on the %i status', (status) => {
    const error = fail('/api/all/mef/', status);

    expect(apiStatus.unavailableStatus()).toBe(status);
    // The error is passed on to the caller
    expect(error).toBeInstanceOf(HttpErrorResponse);
  });

  it.each([400, 404, 410, 500])('should not report the %i status', (status) => {
    fail('/api/agents/mef/1', status);
    expect(apiStatus.unavailableStatus()).toBeNull();
  });

  it('should not report the failure of a request started before a reset', () => {
    http.get('/api/version').subscribe({ error: () => undefined });
    apiStatus.retry();
    backend.expectOne('/api/version').error(new ProgressEvent('error'));

    expect(apiStatus.unavailableStatus()).toBeNull();
  });

  it('should not report the failed requests outside of the API', () => {
    fail('/assets/i18n/en.json', 0);
    expect(apiStatus.unavailableStatus()).toBeNull();
  });
});
