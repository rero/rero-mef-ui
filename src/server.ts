// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { join } from 'node:path';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';

import { RuntimeConfig } from './app/runtime-config';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
/**
 * Proxy headers sent by the reverse proxies (nginx, load balancer), trusted to render the pages. Angular trusts only
 * `X-Forwarded-Host` and `X-Forwarded-Proto` by default: with any other `X-Forwarded-*` header (e.g.
 * `X-Forwarded-For`), it skips the server rendering and sends the empty page shell, without the runtime
 * configuration (`API_URL`). Not `true`: the headers the proxies don't send (`X-Forwarded-Port`,
 * `X-Forwarded-Prefix`) stay ignored.
 */
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'],
});

/**
 * Runtime configuration of the application, from the environment variables: the same build runs on
 * the test and production servers. Without them, the values of `src/environments` apply.
 */
const runtimeConfig: RuntimeConfig = {
  apiUrl: process.env['API_URL']?.replace(/\/+$/, '') || undefined,
};

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req, runtimeConfig)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
