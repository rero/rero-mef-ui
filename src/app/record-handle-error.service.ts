// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RecordHandleErrorService } from '@rero/ng-core';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * Errors of the record requests with the HTTP status of the response: ng-core replaces the
 * statuses it doesn't know (e.g. `410`, `503`, `0` without response) by `500`, so that the error
 * pages could not tell them apart. ng-core's title is kept.
 */
@Injectable({ providedIn: 'root' })
export class AppRecordHandleErrorService extends RecordHandleErrorService {
  override handleError(error: HttpErrorResponse): Observable<never> {
    return super
      .handleError(error)
      .pipe(catchError((handled: object) => throwError(() => ({ ...handled, status: error.status }))));
  }
}
