// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EsResult, RecordService } from '@rero/ng-core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { map } from 'rxjs';

import { EntityMetadata } from '../entity.model';
import { entityDetailLink, entityName } from '../entity.utils';

/** Maximum number of related records displayed. */
const MAX_RESULTS = 20;

/**
 * `relation_pid` of a source record: pid of the related record, with the direction of the
 * redirect, in a PrimeNG accordion. When its panel is expanded, the MEF records of this pid are
 * searched in the index of the entity type (e.g. `agents/mef/?q=gnd.pid:003050076`), as the
 * `all/mef` index only has `$ref` links.
 */
@Component({
  selector: 'app-entity-relation',
  imports: [Accordion, AccordionContent, AccordionHeader, AccordionPanel, RouterLink],
  templateUrl: './entity-relation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityRelation {
  private readonly recordService = inject(RecordService);

  /** Entity type of the API index: `agents`, `concepts` or `places`. */
  readonly entityType = input.required<string>();
  /** Source of the related record (e.g. `gnd`). */
  readonly source = input.required<string>();
  /** Pid of the related record in the source. */
  readonly pid = input.required<string>();
  /** Icon and label of the redirect direction. */
  readonly icon = input.required<{ class: string; label: string }>();

  /**
   * Compact accordion pass-through, displayed as a field value: no header padding, background or
   * border, and the toggle icon before the pid (`flex-row-reverse`). Tailwind utilities override
   * PrimeNG styles (`primeng` CSS layer below `utilities`).
   */
  protected readonly accordionPt = {
    panel: { root: { class: 'border-0' } },
    header: {
      root: {
        class:
          'inline-flex flex-row-reverse justify-end gap-2 rounded-sm bg-transparent p-0 font-normal text-inherit hover:underline',
      },
      toggleicon: { class: 'size-3' },
    },
    content: { content: { class: 'bg-transparent p-0 pt-1 pl-5' } },
  };

  /** True once the panel has been expanded: the search is not run again when it is collapsed. */
  private readonly requested = signal(false);

  /** Search query of the related records, e.g. `gnd.pid:003050076`. */
  protected readonly query = computed(() => `${this.source()}.pid:${this.pid()}`);

  /** Related MEF records, loaded the first time the panel is expanded. */
  protected readonly records = rxResource({
    params: () => (this.requested() ? { index: `${this.entityType()}/mef`, query: this.query() } : undefined),
    stream: ({ params }) =>
      this.recordService
        .getRecords<EsResult<EntityMetadata>>(params.index, {
          query: params.query,
          itemsPerPage: MAX_RESULTS,
        })
        .pipe(
          map((result) =>
            result.hits.hits.map(({ metadata }) => ({
              pid: metadata.pid,
              name: entityName(metadata) ?? metadata.pid,
              link: entityDetailLink(metadata),
            })),
          ),
        ),
  });

  /**
   * Runs the search the first time the panel is expanded. `valueChange` is used instead of
   * `onOpen`, which is not emitted when the panel is expanded with the keyboard.
   */
  protected onValueChange(value: unknown): void {
    if (value != null) {
      this.requested.set(true);
    }
  }
}
