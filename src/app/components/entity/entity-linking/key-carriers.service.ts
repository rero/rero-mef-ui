// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { inject, Injectable } from '@angular/core';
import { EsResult, RecordService } from '@rero/ng-core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { EntityMetadata, EntitySource, EntitySourceName } from '../entity.model';
import { entityDetailLink } from '../entity.utils';
import { CarrierSearch, KeyCarrier } from '../record-linking';

/** Maximum number of records searched per source: a link key is carried by a few records at most. */
const MAX_RESULTS = 20;

/** Search query of the source records carrying one of the keys, e.g. `_association_identifier:("FRBNF11932434")`. */
export function carrierQuery(keys: string[]): string {
  return `_association_identifier:(${keys.map((key) => `"${key}"`).join(' OR ')})`;
}

/** Search query of the MEF records of source records, e.g. `gnd.pid:("040379442") OR idref.pid:("02723875X")`. */
export function mefQuery(carriers: KeyCarrier[]): string {
  const sources = [...new Set(carriers.map(({ source }) => source))];
  return sources
    .map((source) => {
      const pids = carriers.filter((carrier) => carrier.source === source).map(({ pid }) => `"${pid}"`);
      return `${source}.pid:(${pids.join(' OR ')})`;
    })
    .join(' OR ');
}

/**
 * Source record of a search hit, as a carrier of the link keys: with the searched keys it carries,
 * from its `_association_identifier` (a list, or a single key for the places).
 */
export function keyCarrier(
  source: EntitySourceName,
  { pid, authorized_access_point, _association_identifier, _association_level }: EntitySource,
  keys: string[],
): KeyCarrier {
  return {
    source,
    pid,
    name: authorized_access_point,
    keys: [_association_identifier]
      .flat()
      .filter((key): key is string => typeof key === 'string' && keys.includes(key)),
    level: typeof _association_level === 'string' ? _association_level : undefined,
  };
}

/** Carriers with the MEF record of their source record, found among the MEF records. */
export function withMefRecords(carriers: KeyCarrier[], records: EntityMetadata[]): KeyCarrier[] {
  return carriers.map((carrier) => {
    const record = records.find((metadata) => metadata[carrier.source]?.pid === carrier.pid);
    return record ? { ...carrier, mef: { pid: record.pid, link: entityDetailLink(record) } } : carrier;
  });
}

/**
 * Source records carrying the link keys of a record, with their MEF record: in the index of each
 * source (`_association_identifier`, not in the MEF index), then their MEF records.
 */
@Injectable({ providedIn: 'root' })
export class KeyCarriersService {
  private readonly recordService = inject(RecordService);

  carriers({ category, keys, sources }: CarrierSearch): Observable<KeyCarrier[]> {
    const query = carrierQuery(keys);
    const searches = sources.map((source) =>
      this.recordService
        .getRecords<EsResult<EntitySource>>(`${category}/${source}`, { query, itemsPerPage: MAX_RESULTS })
        .pipe(map((result) => result.hits.hits.map(({ metadata }) => keyCarrier(source, metadata, keys)))),
    );
    return forkJoin(searches).pipe(
      map((lists) => lists.flat()),
      switchMap((carriers) =>
        carriers.length
          ? this.recordService
              .getRecords<EsResult<EntityMetadata>>(`${category}/mef`, {
                query: mefQuery(carriers),
                // One MEF record per carrier at most
                itemsPerPage: carriers.length,
              })
              .pipe(
                map((result) =>
                  withMefRecords(
                    carriers,
                    result.hits.hits.map(({ metadata }) => metadata),
                  ),
                ),
              )
          : of(carriers),
      ),
    );
  }
}
