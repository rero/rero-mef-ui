// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { inject, Injectable, REQUEST_CONTEXT, TransferState } from '@angular/core';
import { CoreConfigService } from '@rero/ng-core';

import { environment } from '../environments/environment';
import { RUNTIME_CONFIG_KEY, RuntimeConfig } from './runtime-config';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService extends CoreConfigService {
  constructor() {
    super();
    const { apiUrl } = runtimeConfig();
    this.production = environment.production;
    this.projectTitle = environment.projectTitle;
    this.apiBaseUrl = apiUrl ?? environment.apiBaseUrl;
    this.schemaFormEndpoint = '/api/schemaform';
    this.$refPrefix = apiUrl ?? environment.$refPrefix;
    this.defaultLanguage = 'en';
    this.translationsURLs = environment.translationsURLs;
  }
}

/** Runtime configuration: from the server (request context), passed on to the browser with the page. */
function runtimeConfig(): RuntimeConfig {
  const transferState = inject(TransferState);
  const context = inject(REQUEST_CONTEXT, { optional: true }) as RuntimeConfig | null;
  if (context) {
    transferState.set(RUNTIME_CONFIG_KEY, context);
    return context;
  }
  return transferState.get(RUNTIME_CONFIG_KEY, {});
}
