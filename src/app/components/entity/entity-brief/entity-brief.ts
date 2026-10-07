// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DetailUrl, ResultItem } from '@rero/ng-core';

import { EntityIcon } from '../entity-icon/entity-icon';
import { EntitySources } from '../entity-sources/entity-sources';
import { EntityTypeLabel } from '../entity-type/entity-type';
import { EntityRecord } from '../entity.model';
import { entityDetailLink, entityName } from '../entity.utils';

/** Search result of a MEF record, created by ng-core with the `ResultItem` inputs. */
@Component({
  selector: 'app-entity-brief',
  imports: [DatePipe, EntityIcon, EntitySources, EntityTypeLabel, RouterLink],
  templateUrl: './entity-brief.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityBrief implements ResultItem<EntityRecord> {
  readonly record = input.required<EntityRecord>();
  /** Record type key (e.g. `mef`): bound by ng-core, not used. */
  readonly type = input.required<string>();
  readonly detailUrl = input<DetailUrl>();

  /**
   * Link to the detail view, in the type of the entity (e.g. /concepts/detail/123), so that the
   * record is loaded from its own API index. ng-core's `detailUrl` (relative to the search type)
   * is only used to know whether the record can be displayed.
   */
  readonly detailLink = computed(() => entityDetailLink(this.record().metadata));

  readonly name = computed(() => entityName(this.record().metadata));

  /** Id of the title, which labels the result (`aria-labelledby`). */
  protected readonly titleId = computed(() => `entity-brief-${this.record().metadata.pid}`);
}
