// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { REQUEST_CONTEXT, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { AppConfigService } from './app-config.service';
import { RUNTIME_CONFIG_KEY } from './runtime-config';

const API_URL = 'https://mef.test.rero.ch';

describe('AppConfigService', () => {
  it('should use the API URL of the server and pass it on to the browser', () => {
    TestBed.configureTestingModule({ providers: [{ provide: REQUEST_CONTEXT, useValue: { apiUrl: API_URL } }] });
    const { apiBaseUrl, $refPrefix } = TestBed.inject(AppConfigService);

    expect(apiBaseUrl).toBe(API_URL);
    expect($refPrefix).toBe(API_URL);
    expect(TestBed.inject(TransferState).get(RUNTIME_CONFIG_KEY, null)).toEqual({ apiUrl: API_URL });
  });

  it('should use the API URL passed on by the server in the browser', () => {
    TestBed.inject(TransferState).set(RUNTIME_CONFIG_KEY, { apiUrl: API_URL });
    const { apiBaseUrl, $refPrefix } = TestBed.inject(AppConfigService);

    expect(apiBaseUrl).toBe(API_URL);
    expect($refPrefix).toBe(API_URL);
  });

  it('should use the environment without runtime configuration', () => {
    const { apiBaseUrl, $refPrefix } = TestBed.inject(AppConfigService);

    expect(apiBaseUrl).toBe(environment.apiBaseUrl);
    expect($refPrefix).toBe(environment.$refPrefix);
  });
});
