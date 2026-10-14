// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { AppRecordHandleErrorService } from './record-handle-error.service';

describe('AppRecordHandleErrorService', () => {
  let service: AppRecordHandleErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    service = TestBed.inject(AppRecordHandleErrorService);
  });

  it('should keep the status of the response, unknown to ng-core', async () => {
    const error = await firstValueFrom(service.handleError(new HttpErrorResponse({ status: 503 }))).catch(
      (handled: unknown) => handled,
    );
    expect(error).toEqual({ status: 503, title: 'An error occurred' });
  });

  it('should keep the title of ng-core', async () => {
    const error = await firstValueFrom(service.handleError(new HttpErrorResponse({ status: 404 }))).catch(
      (handled: unknown) => handled,
    );
    expect(error).toEqual({ status: 404, title: 'Not found' });
  });
});
