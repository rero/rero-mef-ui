// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { responseStatusInterceptor } from './response-status.interceptor';

describe('responseStatusInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let response: ResponseInit;

  function setup(responseInit: ResponseInit | null): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([responseStatusInterceptor])),
        provideHttpClientTesting(),
        { provide: RESPONSE_INIT, useValue: responseInit },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  function fail(status: number): void {
    http.get('/api/agents/mef/1').subscribe({ error: () => undefined });
    backend.expectOne('/api/agents/mef/1').flush(null, { status, statusText: 'Error' });
  }

  afterEach(() => backend.verify());

  describe('on the server', () => {
    beforeEach(() => {
      response = {};
      setup(response);
    });

    it.each([404, 410])('should give the page the %i status of the API', (status) => {
      fail(status);
      expect(response.status).toBe(status);
    });

    it('should keep the page status on the other errors', () => {
      fail(500);
      expect(response.status).toBeUndefined();
    });
  });

  it('should do nothing in the browser', () => {
    setup(null);
    expect(() => fail(404)).not.toThrow();
  });
});
