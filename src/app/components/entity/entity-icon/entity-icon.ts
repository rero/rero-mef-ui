// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ENTITY_CATEGORIES, ENTITY_TYPES, EntityCategory, EntityType } from '../entity.model';
import { entityTypeLabel } from '../entity.utils';

/**
 * Round icon badge of an entity type (`type`, e.g. `bf:Person`) or of a main entity type
 * (`category`, e.g. `agents`), with the type as tooltip (e.g. `Agent: Person`). Hidden from screen
 * readers: the type is always displayed as text next to it.
 */
@Component({
  selector: 'app-entity-icon',
  templateUrl: './entity-icon.html',
  host: { class: 'block shrink-0', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityIcon {
  /** Entity type: search results, detail view. */
  readonly type = input<EntityType>();
  /** Main entity type, when there is no record: entity type cards of the home page. */
  readonly category = input<EntityCategory>();
  /** Icon in red, for a deleted record. */
  readonly deleted = input(false);
  /** `md`: search results, `lg`: detail view. */
  readonly size = input<'md' | 'lg'>('md');

  private readonly categoryInfo = computed(() =>
    ENTITY_CATEGORIES.find((category) => category.key === this.category()),
  );

  protected readonly icon = computed(() => {
    const type = this.type();
    return type ? ENTITY_TYPES[type].icon : this.categoryInfo()?.icon;
  });

  protected readonly label = computed(() => {
    const type = this.type();
    return type ? entityTypeLabel(type) : this.categoryInfo()?.title;
  });

  protected readonly badgeClass = computed(() =>
    [
      this.size() === 'lg' ? 'size-12 text-xl sm:size-14 sm:text-2xl' : 'size-10 text-lg sm:size-12 sm:text-xl',
      this.deleted() ? 'bg-surface text-danger ring-1 ring-red-400' : 'bg-surface-accent text-heading',
    ].join(' '),
  );
}
