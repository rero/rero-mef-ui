// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/** Date aggregations displayed with the ng-core date range widget. */
const DATE_RANGE_AGGREGATIONS = ['creation_date', 'update_date'];

/** Search endpoints of the MEF API (not the record detail ones). */
const SEARCH_URL = /\/api\/(all|agents|concepts|places)\/mef\/?(\?|$)/;

/** Filter value sent by the ng-core widget: `<start ms>--<end ms>`. */
const WIDGET_RANGE = /^(\d+)--(\d+)$/;

interface DateHistogramBucket {
  key: number;
  doc_count: number;
}

/** `YYYY-MM-DD` of a timestamp, in local time (the widget builds its dates in local time). */
function isoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converts the widget range filters to the backend format. */
function toBackendParams(params: HttpParams): HttpParams {
  return DATE_RANGE_AGGREGATIONS.reduce((result, key) => {
    const match = WIDGET_RANGE.exec(result.get(key) ?? '');
    return match ? result.set(key, `${isoDate(+match[1])}:${isoDate(+match[2])}`) : result;
  }, params);
}

/** Turns the day histograms into date range aggregations (bounds = first and last day). */
function toDateRangeAggregations(body: unknown): unknown {
  const aggregations = (body as { aggregations?: Record<string, unknown> } | null)?.aggregations;
  if (!aggregations) {
    return body;
  }
  const converted = { ...aggregations };
  for (const key of DATE_RANGE_AGGREGATIONS) {
    const buckets = (aggregations[key] as { buckets?: DateHistogramBucket[] } | undefined)?.buckets;
    if (!buckets) {
      continue;
    }
    const days = buckets.map((bucket) => bucket.key);
    converted[key] = {
      type: 'date-range',
      config: days.length ? { min: Math.min(...days), max: Math.max(...days) } : {},
    };
  }
  return { ...(body as object), aggregations: converted };
}

/**
 * Date aggregations of the MEF API displayed with the ng-core date range widget.
 *
 * The widget and the backend don't use the same format, so this interceptor adapts both sides:
 * - request filter: `<start ms>--<end ms>` (widget) -> `YYYY-MM-DD:YYYY-MM-DD` (backend);
 * - response aggregation: day `date_histogram` buckets (backend) ->
 *   `{ type: 'date-range', config: { min, max } }` (widget).
 */
export const dateRangeAggregationInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !SEARCH_URL.test(req.url)) {
    return next(req);
  }
  return next(req.clone({ params: toBackendParams(req.params) })).pipe(
    map((event) =>
      event instanceof HttpResponse ? event.clone({ body: toDateRangeAggregations(event.body) }) : event,
    ),
  );
};
