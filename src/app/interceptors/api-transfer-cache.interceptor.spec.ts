// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiTransferCache, apiTransferCacheInterceptor } from './api-transfer-cache.interceptor';

const URL = '/api/all/mef/';
const KEY = makeStateKey<unknown>(`api:${URL}?q=einstein`);

describe('apiTransferCacheInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let transferState: TransferState;

  function setup(platform: 'server' | 'browser'): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiTransferCacheInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    transferState = TestBed.inject(TransferState);
  }

  afterEach(() => backend.verify());

  describe('on the server', () => {
    beforeEach(() => setup('server'));

    it('should store the API responses', () => {
      http.get(URL, { params: { q: 'einstein' } }).subscribe();
      backend.expectOne(`${URL}?q=einstein`).flush({ hits: [] });

      expect(transferState.get(KEY, null)).toMatchObject({ body: { hits: [] }, status: 200 });
    });

    it('should not store the other responses', () => {
      http.get('/assets/i18n/en.json').subscribe();
      backend.expectOne('/assets/i18n/en.json').flush({});

      expect(transferState.isEmpty).toBe(true);
    });
  });

  describe('in the browser', () => {
    beforeEach(() => setup('browser'));

    it('should answer with the transferred response during the hydration', () => {
      transferState.set(KEY, { body: { hits: [] }, status: 200, url: URL });
      const next = vi.fn();

      http.get(URL, { params: { q: 'einstein' } }).subscribe(next);

      backend.expectNone(`${URL}?q=einstein`);
      expect(next).toHaveBeenCalledWith({ hits: [] });
    });

    it('should request the API after the hydration', () => {
      transferState.set(KEY, { body: { hits: [] }, status: 200, url: URL });
      TestBed.inject(ApiTransferCache).active = false;

      http.get(URL, { params: { q: 'einstein' } }).subscribe();

      backend.expectOne(`${URL}?q=einstein`).flush({});
    });
  });
});
