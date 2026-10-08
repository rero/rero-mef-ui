// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AuthoritySource, ENTITY_TYPES, EntityMetadata, EntityType, SOURCE_TAG_SEVERITY } from './entity.model';

/**
 * Readable type of an entity: main type and type, e.g. `Agent: Person`, or only the main type when
 * they are the same (`Place`).
 */
export function entityTypeLabel(type: EntityType): string {
  const { name, category } = ENTITY_TYPES[type];
  return name === category ? category : `${category}: ${name}`;
}

/**
 * Link to the detail view of a MEF record, in the index of its entity type (e.g.
 * `/concepts/detail/123`), so that the record is loaded from its own API index.
 */
export function entityDetailLink({ type, pid }: Pick<EntityMetadata, 'type' | 'pid'>): string {
  return `/${ENTITY_TYPES[type].type}/detail/${pid}`;
}

/** Name of an entity: `authorized_access_point` of the first source which has one. */
export function entityName(metadata: EntityMetadata): string | undefined {
  return metadata.sources.map((source) => metadata[source]?.authorized_access_point).find((name) => !!name);
}

/**
 * Text color of a source, as the text of its tag (CSS variable of the PrimeNG theme, light and dark
 * modes), e.g. `var(--p-tag-info-color)` for GND. Sources without severity have the primary color.
 */
export function sourceColor(source: AuthoritySource): string {
  return `var(--p-tag-${SOURCE_TAG_SEVERITY[source] ?? 'primary'}-color)`;
}
