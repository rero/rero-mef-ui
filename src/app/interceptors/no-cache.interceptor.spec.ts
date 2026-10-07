// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { noCacheInterceptor } from './no-cache.interceptor';

describe('noCacheInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([noCacheInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('should bypass the browser cache for the API GET requests', () => {
    http.get('/api/agents/mef/1?resolve=1').subscribe();
    http.get('https://mef.rero.ch/api/all/mef/').subscribe();

    expect(backend.expectOne('/api/agents/mef/1?resolve=1').request.cache).toBe('no-store');
    expect(backend.expectOne('https://mef.rero.ch/api/all/mef/').request.cache).toBe('no-store');
  });

  it('should leave the other requests unchanged', () => {
    http.get('/assets/i18n/en.json').subscribe();
    http.post('/api/agents/mef/', {}).subscribe();

    expect(backend.expectOne('/assets/i18n/en.json').request.cache).not.toBe('no-store');
    expect(backend.expectOne('/api/agents/mef/').request.cache).not.toBe('no-store');
  });
});
