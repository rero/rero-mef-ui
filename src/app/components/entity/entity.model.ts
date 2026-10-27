// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Links, RecordData } from '@rero/ng-core';
import type { Tag } from 'primeng/tag';

/**
 * Main entity types, each one with its own API index (e.g. `/api/agents/mef/`): key, plural title
 * and icon.
 */
export const ENTITY_CATEGORIES = [
  { key: 'agents', title: 'Agents', icon: 'fa-solid fa-user' },
  { key: 'concepts', title: 'Concepts', icon: 'fa-solid fa-lightbulb' },
  { key: 'places', title: 'Places', icon: 'fa-solid fa-location-pin' },
] as const;

/** API index of a main entity type: `agents`, `concepts` or `places`. */
export type EntityCategory = (typeof ENTITY_CATEGORIES)[number]['key'];

/** Type guard: true if `key` is a main entity type (e.g. `agents`). */
export function isEntityCategory(key: string): key is EntityCategory {
  return ENTITY_CATEGORIES.some((category) => category.key === key);
}

/**
 * Entity types: `name` of the type, `category` (main type, e.g. `Agent` for a person), API index
 * `type` and `icon`.
 */
export const ENTITY_TYPES = {
  'bf:Person': { name: 'Person', category: 'Agent', type: 'agents', icon: 'fa-solid fa-user' },
  'bf:Organisation': {
    name: 'Organisation',
    category: 'Agent',
    type: 'agents',
    icon: 'fa-solid fa-building',
  },
  'bf:Topic': {
    name: 'Topic',
    category: 'Concept',
    type: 'concepts',
    icon: 'fa-solid fa-lightbulb',
  },
  'bf:Temporal': {
    name: 'Temporal',
    category: 'Concept',
    type: 'concepts',
    icon: 'fa-solid fa-clock',
  },
  'bf:Place': {
    name: 'Place',
    category: 'Place',
    type: 'places',
    icon: 'fa-solid fa-location-pin',
  },
} as const satisfies Record<string, { name: string; category: string; type: EntityCategory; icon: string }>;

export type EntityType = keyof typeof ENTITY_TYPES;

/** Type guard: true if `key` is a known entity type (e.g. `bf:Person`). */
export function isEntityType(key: string): key is EntityType {
  // Own keys only: `in` would accept the inherited ones, e.g. `constructor`
  return Object.hasOwn(ENTITY_TYPES, key);
}

export type EntitySourceName = 'gnd' | 'idref' | 'rero';

/** Authority sources: the sources of the MEF records, and VIAF (linking hub of the agents). */
export type AuthoritySource = EntitySourceName | 'viaf';

/** Official names of the sources. */
export const SOURCE_LABELS = {
  gnd: 'GND',
  idref: 'IdRef',
  rero: 'RERO',
  viaf: 'VIAF',
} as const satisfies Record<AuthoritySource, string>;

/** Severity of the source tags (`p-tag`). `undefined` is the default severity: primary color. */
export const SOURCE_TAG_SEVERITY = {
  gnd: 'info',
  idref: undefined,
  rero: 'warn',
  viaf: 'success',
} as const satisfies Record<AuthoritySource, Tag['severity']>;

/** An object of the API (e.g. an item of `identifiedBy`). */
export type ApiObject = Record<string, unknown>;

export type EntitySource = {
  pid: string;
  authorized_access_point?: string;
  preferred_name?: string;
  identifier?: string;
  type: string;
  // Any other API field, typed as `unknown`
  [key: string]: unknown;
};

export type EntityMetadata = {
  pid: string;
  type: EntityType;
  sources: EntitySourceName[];
  gnd?: EntitySource;
  idref?: EntitySource;
  rero?: EntitySource;
  authorized_access_point?: string;
  viaf_pid?: string;
  deleted?: string;
  [key: string]: unknown;
};

/** Record links, with the VIAF links returned by the MEF API (keys can contain a dot). */
export type EntityLinks = Links & {
  viaf?: string;
  'viaf.org'?: string;
};

export type EntityRecord = Omit<RecordData<EntityMetadata>, 'links'> & { links: EntityLinks };
