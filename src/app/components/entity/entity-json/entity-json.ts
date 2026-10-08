// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RecordService } from '@rero/ng-core';
import { Dialog } from 'primeng/dialog';

import { JsonTree } from '../../json-tree/json-tree';

/**
 * Button opening a dialog with the raw JSON of a record, as returned by the API
 * (e.g. `/api/agents/gnd/117023450`), with the `$ref` resolved (`resolve=1`), as a collapsible
 * tree. The record is loaded the first time the dialog is opened.
 */
@Component({
  selector: 'app-entity-json',
  imports: [Dialog, JsonTree],
  templateUrl: './entity-json.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityJson {
  private readonly recordService = inject(RecordService);

  /** API index of the record, e.g. `agents/mef` or `agents/gnd`. */
  readonly index = input.required<string>();
  /** Pid of the record. */
  readonly pid = input.required<string>();
  /** Dialog title, e.g. `gnd`. */
  readonly label = input.required<string>();

  protected readonly visible = signal(false);
  /** True once the dialog has been opened: the record is not loaded again. */
  private readonly requested = signal(false);

  protected readonly record = rxResource({
    params: () => (this.requested() ? { index: this.index(), pid: this.pid() } : undefined),
    stream: ({ params }) => this.recordService.getRecord(params.index, params.pid, { resolve: 1 }),
  });

  protected open(): void {
    this.requested.set(true);
    this.visible.set(true);
  }
}
