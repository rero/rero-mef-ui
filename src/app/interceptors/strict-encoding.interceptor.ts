// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpInterceptorFn, HttpParameterCodec, HttpParams } from '@angular/common/http';

import { isApiGet } from './api-request';

/** Percent-encoding of RFC 3986: `encodeURIComponent`, plus the reserved characters `!'()*`. */
function strictEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Codec encoding all the reserved characters of the query string. */
export const strictCodec: HttpParameterCodec = {
  encodeKey: strictEncode,
  encodeValue: strictEncode,
  decodeKey: decodeURIComponent,
  decodeValue: decodeURIComponent,
};

/**
 * Percent-encodes all the reserved characters of the API query strings.
 *
 * The default codec of Angular (`HttpUrlEncodingCodec`) leaves some of them as is (`$`, `'`, `@`,
 * `:`...), and the API rejects the raw `$` and `'` with `400 Error trying to decode a non urlencoded
 * string`: a search for `$` failed.
 */
export const strictEncodingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiGet(req) || !req.params.keys().length) {
    return next(req);
  }
  const { params } = req;
  const fromObject = Object.fromEntries(params.keys().map((key) => [key, params.getAll(key) ?? []]));
  return next(req.clone({ params: new HttpParams({ encoder: strictCodec, fromObject }) }));
};
