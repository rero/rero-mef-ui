// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, HttpParams, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { strictEncodingInterceptor } from './strict-encoding.interceptor';

describe('strictEncodingInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([strictEncodingInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('should percent-encode all the reserved characters of the API query strings', () => {
    const params = new HttpParams().set('q', `$'@:,;=?/!()*~ <>`).append('entity', 'agents').append('entity', 'places');
    http.get('/api/all/mef/', { params }).subscribe();

    const { request } = backend.expectOne(() => true);
    expect(request.urlWithParams).toBe(
      '/api/all/mef/?q=%24%27%40%3A%2C%3B%3D%3F%2F%21%28%29%2A~%20%3C%3E&entity=agents&entity=places',
    );
    expect(request.params.get('q')).toBe(`$'@:,;=?/!()*~ <>`);
  });

  it('should leave the other requests unchanged', () => {
    const params = new HttpParams().set('q', '$');
    http.get('/assets/i18n/en.json', { params }).subscribe();

    expect(backend.expectOne(() => true).request.urlWithParams).toBe('/assets/i18n/en.json?q=$');
  });
});
