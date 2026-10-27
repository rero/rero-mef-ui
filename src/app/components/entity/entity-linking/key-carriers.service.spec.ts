// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';
import { RecordService } from '@rero/ng-core';
import { firstValueFrom, of } from 'rxjs';

import { EntityMetadata } from '../entity.model';
import { CarrierSearch, KeyCarrier } from '../record-linking';
import { carrierQuery, keyCarrier, KeyCarriersService, mefQuery, withMefRecords } from './key-carriers.service';

describe('carrierQuery', () => {
  it('should search any of the keys in the association identifiers', () => {
    expect(carrierQuery(['FRBNF11932434', 'FRBNF12071492'])).toBe(
      '_association_identifier:("FRBNF11932434" OR "FRBNF12071492")',
    );
  });
});

describe('mefQuery', () => {
  it('should search the MEF records of the source records, by source', () => {
    const carriers: KeyCarrier[] = [
      { source: 'gnd', pid: '041556208', keys: [] },
      { source: 'idref', pid: '02723875X', keys: [] },
      { source: 'gnd', pid: '040379442', keys: [] },
    ];
    expect(mefQuery(carriers)).toBe('gnd.pid:("041556208" OR "040379442") OR idref.pid:("02723875X")');
  });
});

describe('keyCarrier', () => {
  it('should read the name, the searched keys it carries and the match level of a source record', () => {
    expect(
      keyCarrier(
        'idref',
        { pid: '1', type: 'bf:Topic', authorized_access_point: 'A', _association_identifier: ['FRBNF1', 'FRBNF2'] },
        ['FRBNF2', 'FRBNF3'],
      ),
    ).toEqual({ source: 'idref', pid: '1', name: 'A', keys: ['FRBNF2'], level: undefined });
    expect(
      keyCarrier('gnd', { pid: '2', type: 'bf:Place', _association_identifier: '2', _association_level: 'x' }, ['2']),
    ).toMatchObject({ keys: ['2'], level: 'x' });
  });
});

describe('withMefRecords', () => {
  it('should add the MEF record of each source record, when found', () => {
    const records = [{ pid: '18730135', type: 'bf:Topic', sources: ['gnd'], gnd: { pid: '1', type: 'bf:Topic' } }];
    expect(
      withMefRecords(
        [
          { source: 'gnd', pid: '1', keys: [] },
          { source: 'idref', pid: '1', keys: [] },
        ],
        records as EntityMetadata[],
      ),
    ).toEqual([
      { source: 'gnd', pid: '1', keys: [], mef: { pid: '18730135', link: '/concepts/detail/18730135' } },
      { source: 'idref', pid: '1', keys: [] },
    ]);
  });
});

describe('KeyCarriersService', () => {
  const getRecords = vi.fn();
  const hits = (metadata: unknown[]) => of({ hits: { hits: metadata.map((item) => ({ metadata: item })), total: 0 } });
  const search: CarrierSearch = {
    category: 'concepts',
    keys: ['FRBNF11932434'],
    sources: ['gnd', 'idref'],
    source: 'gnd',
    pid: '040379442',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: RecordService, useValue: { getRecords } }] });
  });

  afterEach(() => vi.resetAllMocks());

  it('should search the keys in each source, then the MEF records of the carriers', async () => {
    getRecords.mockImplementation((index: string) =>
      index === 'concepts/mef'
        ? hits([{ pid: '18730135', type: 'bf:Topic', gnd: { pid: '040379442' } }])
        : hits(
            index === 'concepts/gnd'
              ? [{ pid: '040379442', type: 'bf:Topic', _association_identifier: ['FRBNF11932434'] }]
              : [],
          ),
    );
    const carriers = await firstValueFrom(TestBed.inject(KeyCarriersService).carriers(search));
    expect(carriers).toEqual([
      {
        source: 'gnd',
        pid: '040379442',
        keys: ['FRBNF11932434'],
        mef: { pid: '18730135', link: '/concepts/detail/18730135' },
      },
    ]);
    const query = '_association_identifier:("FRBNF11932434")';
    expect(getRecords.mock.calls).toEqual([
      ['concepts/gnd', { query, itemsPerPage: 20 }],
      ['concepts/idref', { query, itemsPerPage: 20 }],
      ['concepts/mef', { query: 'gnd.pid:("040379442")', itemsPerPage: 1 }],
    ]);
  });

  it('should not search the MEF records when no record carries the keys', async () => {
    getRecords.mockImplementation(() => hits([]));
    const service = TestBed.inject(KeyCarriersService);
    expect(await firstValueFrom(service.carriers({ ...search, sources: ['gnd'] }))).toEqual([]);
    expect(getRecords).toHaveBeenCalledTimes(1);
  });
});
