// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ENTITY_TYPES, EntityType } from '../entity.model';

/**
 * Type of an entity, displayed above its name: main type, then type, e.g. `AGENT › Person`. The
 * type is not repeated when it is the same as the main type (`PLACE`). A deleted record is
 * flagged after the type, with the deletion date if `showDeletedDate` is set.
 */
@Component({
  selector: 'app-entity-type',
  imports: [DatePipe],
  templateUrl: './entity-type.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTypeLabel {
  readonly type = input.required<EntityType>();
  /** Deletion date of the record. */
  readonly deleted = input<string>();
  readonly showDeletedDate = input(false);

  protected readonly category = computed(() => ENTITY_TYPES[this.type()].category);

  /** Type name, `undefined` when it is the same as the main type. */
  protected readonly name = computed(() => {
    const { name, category } = ENTITY_TYPES[this.type()];
    return name === category ? undefined : name;
  });
}
