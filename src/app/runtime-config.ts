// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { makeStateKey } from '@angular/core';

/**
 * Configuration read by the server when it starts, from its environment variables (`server.ts`):
 * the same build is deployed on the test and production servers.
 * Given to the application on the server as request context (`REQUEST_CONTEXT`), and to the
 * browser with the page (`TransferState`).
 */
export interface RuntimeConfig {
  /** Base URL of the MEF API (e.g. `https://mef.test.rero.ch`): `API_URL` environment variable. */
  apiUrl?: string;
}

export const RUNTIME_CONFIG_KEY = makeStateKey<RuntimeConfig>('runtimeConfig');
