// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rendering of the routes on the server at each request, so that the search engines index the content
 * and the pages get the runtime configuration of the server (`RuntimeConfig`): no prerendering at build time.
 */
export const serverRoutes: ServerRoute[] = [
  // The record counts change slowly: the browsers and the proxies can keep the page 5 minutes
  { path: '', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=300' } },
  // Static page, which changes only with a new version: the browsers and the proxies can keep it 1 hour
  { path: 'linking', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=3600' } },
  { path: '**', renderMode: RenderMode.Server },
];
