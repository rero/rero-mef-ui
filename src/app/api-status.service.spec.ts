// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ApiStatus } from './api-status.service';

describe('ApiStatus', () => {
  let apiStatus: ApiStatus;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    apiStatus = TestBed.inject(ApiStatus);
  });

  it('should be available by default', () => {
    expect(apiStatus.unavailableStatus()).toBeNull();
  });

  it('should keep the status of the unavailable API', () => {
    apiStatus.reportUnavailable(503, apiStatus.attempt);
    expect(apiStatus.unavailableStatus()).toBe(503);
  });

  it('should be reset on navigation, which requests the API again', async () => {
    apiStatus.reportUnavailable(0, apiStatus.attempt);
    await TestBed.inject(Router).navigateByUrl('/mef');
    expect(apiStatus.unavailableStatus()).toBeNull();
  });

  it('should be reset on retry', () => {
    apiStatus.reportUnavailable(0, apiStatus.attempt);
    apiStatus.retry();
    expect(apiStatus.unavailableStatus()).toBeNull();
  });

  it('should ignore the failures of the requests started before the last reset', async () => {
    const { attempt } = apiStatus;
    await TestBed.inject(Router).navigateByUrl('/mef');

    apiStatus.reportUnavailable(503, attempt);
    expect(apiStatus.unavailableStatus()).toBeNull();

    apiStatus.reportUnavailable(503, apiStatus.attempt);
    expect(apiStatus.unavailableStatus()).toBe(503);
  });
});
