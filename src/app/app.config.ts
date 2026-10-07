// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay, withNoHttpTransferCache } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTranslateLoader, provideTranslateService, TranslateService } from '@ngx-translate/core';
import {
  CoreConfigService,
  CoreTranslateLoader,
  NgCoreTranslateService,
  primeNGConfig,
  provideCore,
} from '@rero/ng-core';
import { providePrimeNG } from 'primeng/config';

import { AppConfigService } from './app-config.service';
import { routes } from './app.routes';
import { apiTransferCacheInterceptor } from './interceptors/api-transfer-cache.interceptor';
import { dateRangeAggregationInterceptor } from './interceptors/date-range-aggregation.interceptor';
import { noCacheInterceptor } from './interceptors/no-cache.interceptor';
import { responseStatusInterceptor } from './interceptors/response-status.interceptor';

/**
 * Dark mode: enabled when the `app-dark` class is set on the `<html>` element. ng-core disables it
 * (`darkModeSelector: false`); the same selector is used by the Tailwind `dark:` variant
 * (`@custom-variant dark` in `styles.css`).
 */
const primeNGDarkModeConfig = {
  ...primeNGConfig,
  theme: {
    ...primeNGConfig.theme,
    options: { ...primeNGConfig.theme?.options, darkModeSelector: '.app-dark' },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideCore(),
    { provide: CoreConfigService, useExisting: AppConfigService },
    provideTranslateService({ loader: provideTranslateLoader(CoreTranslateLoader) }),
    { provide: TranslateService, useExisting: NgCoreTranslateService },
    provideAppInitializer(() => inject(NgCoreTranslateService).use(inject(CoreConfigService).defaultLanguage)),
    // `withFetch()`: required by `noCacheInterceptor` (`cache` option of the requests)
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiTransferCacheInterceptor,
        dateRangeAggregationInterceptor,
        noCacheInterceptor,
        responseStatusInterceptor,
      ]),
    ),
    providePrimeNG(primeNGDarkModeConfig),
    provideBrowserGlobalErrorListeners(),
    // `anchorScrolling`: scrolls to the fragment (e.g. /linking#places, "On this page" links);
    // `scrollPositionRestoration`: top of the page on navigation, previous position on back.
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    // HTTP transfer cache of Angular replaced by `apiTransferCacheInterceptor`
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
  ],
};
