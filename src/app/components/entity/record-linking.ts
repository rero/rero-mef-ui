// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  ApiObject,
  ENTITY_TYPES,
  EntityCategory,
  EntityMetadata,
  EntitySource,
  EntitySourceName,
  isEntityType,
} from './entity.model';
import { isObject } from './entity.utils';

/*
 * The rules below reproduce the linking of the MEF server (rero-mef repository), which is the
 * reference: they must not be relaxed, or the card would show links that MEF doesn't make.
 * - places: `rero_mef/places/gnd/api.py` and `rero_mef/places/idref/api.py` (`association`);
 * - concepts: `rero_mef/concepts/gnd/api.py`, `rero_mef/concepts/idref/api.py` (`association`)
 *   and `rero_mef/concepts/utils.py` (`BNF_NUMBER`, `bnf_association_identifiers`);
 * - agents: VIAF clusters, whose members are the source records listed by VIAF itself.
 */

/**
 * Link of a source to the MEF record:
 * - `linked`: the source carries the link key, shared with another source (or with the VIAF cluster);
 * - `unshared`: the source carries a link key, but no other source shares it;
 * - `mismatch`: the sources carry different link keys (agents: another VIAF cluster than the record);
 * - `ambiguous`: the source states several different link keys, so MEF doesn't link it;
 * - `missing`: the source doesn't carry a link key;
 * - `excluded`: the source is not cross-linked for this entity type (RERO concepts).
 */
export type LinkStatus = 'linked' | 'unshared' | 'mismatch' | 'ambiguous' | 'missing' | 'excluded';

/** Source field and items of this field (as in the API) flagged with the LINK KEY tag. */
export interface LinkKeyFlag {
  field: string;
  items: unknown[];
}

/** A source of the record, with its link key. */
export interface SourceLink {
  source: EntitySourceName;
  status: LinkStatus;
  /** Where the source carries its link key, e.g. `identifiedBy (GND)`. */
  field?: string;
  /** Link key as written in the source, e.g. `(DE-101)130692220`; all of them when several. */
  value?: string;
  /** Items carrying the shared link key: only for a linked source. */
  flag?: LinkKeyFlag;
}

/** How the sources of a record are linked, which depends on its entity type (see the linking page). */
export interface RecordLinking {
  category: EntityCategory;
  /** Linking method, e.g. `GND PID`. */
  method: string;
  /** VIAF cluster (`viaf_pid`): linking hub of the agents. */
  hub?: string;
  /** Link key shared by the sources, when they are linked. */
  key?: string;
  sources: SourceLink[];
}

/** Link key found in a source record. */
interface FoundKey {
  /** Where the source carries it, e.g. `identifiedBy (GND)`. */
  field: string;
  /** As written in the source, e.g. `(DE-101)130692220`. */
  value: string;
  /** Normalized value, compared between the sources, e.g. `130692220`. */
  key: string;
  /** API field and item carrying it. */
  apiField: string;
  item: unknown;
}

/**
 * Link keys stated by a source record, as read by the MEF server: `keys` can be compared with the
 * other sources, `ambiguous` are conflicting keys which MEF ignores.
 */
interface SourceKeys {
  keys: FoundKey[];
  ambiguous?: FoundKey[];
}

type KeyFinder = (data: EntitySource) => SourceKeys;

/** The objects of an API list (e.g. `identifiedBy`), the other items skipped. */
function objects(value: unknown): ApiObject[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

/** The string value of an API object, `undefined` when missing or empty. */
function stringValue({ value }: ApiObject): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Distinct values of a list, in their order. */
function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

/**
 * The single key of a source, as MEF: several different keys are ambiguous and give no key. All
 * the items carrying the same key are kept, to be flagged.
 */
function uniqueKey(found: FoundKey[]): SourceKeys {
  return distinct(found.map(({ key }) => key)).length > 1 ? { keys: [], ambiguous: found } : { keys: found };
}

/** Prefix of the GND PIDs in the IdRef places, removed by MEF to match the GND records. */
const GND_PID_PREFIX = '(DE-101)';

/** Places, GND: the anchor, its own `pid`. */
const gndPlaceKeys: KeyFinder = ({ pid }) => ({
  keys: [{ field: 'pid', value: pid, key: pid, apiField: 'pid', item: pid }],
});

/** Places, IdRef: the GND PID in `identifiedBy` (source `GND`, type `bf:Nbn`), with the `(DE-101)` prefix. */
const idrefPlaceKeys: KeyFinder = ({ identifiedBy }) =>
  uniqueKey(
    objects(identifiedBy).flatMap((item) => {
      const value = stringValue(item);
      const { source, type } = item;
      return source === 'GND' && type === 'bf:Nbn' && value?.startsWith(GND_PID_PREFIX)
        ? [
            {
              field: 'identifiedBy (GND)',
              value,
              key: value.slice(GND_PID_PREFIX.length),
              apiField: 'identifiedBy',
              item,
            },
          ]
        : [];
    }),
  );

/**
 * BNF number of a `bf:Nbn` identifier, normalized as by MEF: `FRBNF` and its eight digits, the
 * check character dropped (e.g. `FRBNF17049343` or a BNF ark). As MEF, the source of the identifier
 * is not checked, and the whole value must match.
 */
function bnfNumber(item: ApiObject): string | undefined {
  const match =
    item['type'] === 'bf:Nbn'
      ? /^(?:FRBNF(\d{8})|https?:\/\/[\w.]+\.bnf\.fr\/ark:\/12148\/cb(\d{8}))[0-9A-Za-z]?$/.exec(
          stringValue(item) ?? '',
        )
      : null;
  return match ? `FRBNF${match[1] ?? match[2]}` : undefined;
}

/** Concepts, IdRef: every BNF number in `identifiedBy` (a merged heading keeps all of them). */
const idrefConceptKeys: KeyFinder = ({ identifiedBy }) => ({
  keys: objects(identifiedBy).flatMap((item) => {
    const key = bnfNumber(item);
    return key
      ? [{ field: 'identifiedBy (BNF)', value: stringValue(item) ?? key, key, apiField: 'identifiedBy', item }]
      : [];
  }),
});

/**
 * Concepts, GND: the BNF number of the `exactMatch` entries, or else of the `closeMatch` ones. As
 * MEF, the first match type carrying a BNF number decides.
 */
const gndConceptKeys: KeyFinder = (data) => {
  for (const field of ['exactMatch', 'closeMatch']) {
    const found = objects(data[field]).flatMap((match) =>
      objects(match['identifiedBy']).flatMap((item) => {
        const key = bnfNumber(item);
        return key
          ? [{ field: `${field} (BNF)`, value: stringValue(item) ?? key, key, apiField: field, item: match }]
          : [];
      }),
    );
    if (found.length) {
      return uniqueKey(found);
    }
  }
  return { keys: [] };
};

/** Last segment of a VIAF URL (trailing slash ignored) or bare VIAF id, e.g. `779232`. */
function viafId(value: string): string | undefined {
  return value.replace(/\/+$/, '').split('/').pop();
}

/**
 * Agents: the sources are linked by the VIAF cluster of the record. VIAF itself lists the source
 * records of a cluster, so a source of a record having a cluster is linked even without VIAF
 * identifier of its own; but a source stating only other VIAF clusters in `identifiedBy` is a
 * mismatch.
 */
function agentLink(source: EntitySourceName, data: EntitySource | undefined, hub: string | undefined): SourceLink {
  if (!data || !hub) {
    return { source, status: 'missing' };
  }
  const { pid, identifiedBy } = data;
  const viafs = objects(identifiedBy).filter((item) => item['source'] === 'VIAF' && stringValue(item));
  const viaf = viafs.find((item) => viafId(stringValue(item) ?? '') === hub);
  return {
    source,
    status: viafs.length && !viaf ? 'mismatch' : 'linked',
    field: 'pid',
    value: pid,
    flag: viaf ? { field: 'identifiedBy', items: [viaf] } : undefined,
  };
}

/** Linking methods, by entity type. */
const LINKING_METHODS: Record<EntityCategory, string> = {
  agents: 'VIAF cluster',
  concepts: 'BNF identifier',
  places: 'GND PID',
};

/** Sources linked by a shared identifier, by entity type: the other sources are not cross-linked. */
const KEY_FINDERS: Record<Exclude<EntityCategory, 'agents'>, Partial<Record<EntitySourceName, KeyFinder>>> = {
  concepts: { gnd: gndConceptKeys, idref: idrefConceptKeys },
  places: { gnd: gndPlaceKeys, idref: idrefPlaceKeys },
};

/**
 * Link of a source carrying keys: all their values, and the items to flag when the source is linked.
 */
function keysLink(source: EntitySourceName, status: LinkStatus, found: FoundKey[]): SourceLink {
  const [{ field, apiField }] = found;
  return {
    source,
    status,
    field,
    value: distinct(found.map(({ value }) => value)).join(', '),
    flag: status === 'linked' ? { field: apiField, items: found.map(({ item }) => item) } : undefined,
  };
}

/**
 * How the sources of a record are linked, with the link key of each source: the VIAF cluster for
 * the agents, a shared identifier for the concepts and the places (see the linking page).
 * `undefined` for an unknown entity type or a record without sources.
 */
export function recordLinking(metadata: EntityMetadata): RecordLinking | undefined {
  const { type, sources, viaf_pid: hub } = metadata;
  if (!isEntityType(type) || !sources.length) {
    return undefined;
  }
  const category = ENTITY_TYPES[type].type;
  const method = LINKING_METHODS[category];
  if (category === 'agents') {
    const links = sources.map((source) => agentLink(source, metadata[source], hub));
    return { category, method, hub, key: hub, sources: links };
  }

  const finders = KEY_FINDERS[category];
  const found = sources.map((source) => {
    const finder = finders[source];
    const data = metadata[source];
    return { source, excluded: !finder, ...(finder && data ? finder(data) : { keys: [] }) };
  });
  const carriers = found.filter(({ keys }) => keys.length);
  // Linked when at least two sources carry the same key (IdRef concepts may carry several)
  const key =
    carriers.length > 1
      ? carriers[0].keys.find(({ key }) => carriers.every(({ keys }) => keys.some((other) => other.key === key)))?.key
      : undefined;
  const otherwise: LinkStatus = carriers.length > 1 ? 'mismatch' : 'unshared';
  const links = found.map(({ source, excluded, keys, ambiguous }): SourceLink => {
    if (excluded) {
      return { source, status: 'excluded' };
    }
    if (ambiguous) {
      return keysLink(source, 'ambiguous', ambiguous);
    }
    if (!keys.length) {
      return { source, status: 'missing' };
    }
    // Linked: only the keys shared with the other sources; otherwise all of them
    return key
      ? keysLink(
          source,
          'linked',
          keys.filter((item) => item.key === key),
        )
      : keysLink(source, otherwise, keys);
  });
  return { category, method, key, sources: links };
}
