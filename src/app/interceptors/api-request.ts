// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpRequest } from '@angular/common/http';

/** API URL, relative (`/api/...`, development proxy) or absolute (`https://host/api/...`). */
const API_URL = /^(?:https?:\/\/[^/]+)?\/api\//;

/** True for a GET request to the API. */
export function isApiGet(req: HttpRequest<unknown>): boolean {
  return req.method === 'GET' && API_URL.test(req.url);
}
