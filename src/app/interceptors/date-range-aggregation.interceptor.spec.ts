// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { dateRangeAggregationInterceptor } from './date-range-aggregation.interceptor';

describe('dateRangeAggregationInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([dateRangeAggregationInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('should convert the widget range filter to the backend format', () => {
    const start = new Date(2024, 0, 15).getTime();
    const end = new Date(2024, 1, 20, 23, 59, 59).getTime();
    http.get('/api/all/mef/', { params: { q: '', creation_date: `${start}--${end}` } }).subscribe();

    const req = backend.expectOne((r) => r.url === '/api/all/mef/');
    expect(req.request.params.get('creation_date')).toBe('2024-01-15:2024-02-20');
    expect(req.request.params.get('q')).toBe('');
    req.flush({});
  });

  it('should turn the date histograms into date range aggregations', () => {
    let body: { aggregations: Record<string, unknown> } | undefined;
    http.get<typeof body>('/api/all/mef/').subscribe((response) => (body = response));

    backend.expectOne('/api/all/mef/').flush({
      aggregations: {
        creation_date: {
          buckets: [
            { key: 3000, key_as_string: '...', doc_count: 1 },
            { key: 1000, key_as_string: '...', doc_count: 5 },
          ],
        },
        source: { buckets: [{ key: 'gnd', doc_count: 2 }] },
      },
    });

    expect(body?.aggregations['creation_date']).toEqual({
      type: 'date-range',
      config: { min: 1000, max: 3000 },
    });
    // Other aggregations are left unchanged
    expect(body?.aggregations['source']).toEqual({ buckets: [{ key: 'gnd', doc_count: 2 }] });
  });

  it('should not touch the record detail requests', () => {
    http.get('/api/agents/mef/123', { params: { creation_date: '1--2' } }).subscribe();
    const req = backend.expectOne((r) => r.url === '/api/agents/mef/123');
    expect(req.request.params.get('creation_date')).toBe('1--2');
    req.flush({});
  });
});
