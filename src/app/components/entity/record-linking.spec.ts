// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EntityMetadata } from './entity.model';
import {
  CarrierSearch,
  carrierSearch,
  contestedLinking,
  KeyCarrier,
  RecordLinking,
  recordLinking,
} from './record-linking';

/** Linking of a record of a known entity type. */
function linking(metadata: EntityMetadata): RecordLinking {
  const result = recordLinking(metadata);
  if (!result) {
    throw new Error('Unknown entity type');
  }
  return result;
}

const statuses = ({ sources }: RecordLinking) => sources.map(({ status }) => status);

describe('recordLinking', () => {
  it('should return nothing for an unknown entity type', () => {
    expect(recordLinking({ pid: '1', type: 'bf:Work', sources: ['gnd'] } as unknown as EntityMetadata)).toBeUndefined();
  });

  it('should return nothing for an inherited key used as entity type', () => {
    expect(
      recordLinking({ pid: '1', type: 'constructor', sources: ['gnd'] } as unknown as EntityMetadata),
    ).toBeUndefined();
  });

  it('should return nothing for a record without sources', () => {
    expect(recordLinking({ pid: '1', type: 'bf:Place', sources: [] })).toBeUndefined();
  });

  describe('agents', () => {
    const viaf = { source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/158765450' };
    const agent: EntityMetadata = {
      pid: '1',
      type: 'bf:Organisation',
      sources: ['idref', 'gnd'],
      viaf_pid: '158765450',
      gnd: { pid: '001310518', type: 'bf:Organisation' },
      idref: {
        pid: '104444711',
        type: 'bf:Organisation',
        identifiedBy: [{ source: 'IDREF', type: 'uri', value: 'http://www.idref.fr/104444711' }, viaf],
      },
    };

    it('should link the agents by their VIAF cluster, and flag the VIAF identifier', () => {
      expect(linking(agent)).toEqual({
        category: 'agents',
        method: 'VIAF cluster',
        hub: '158765450',
        key: '158765450',
        sources: [
          {
            source: 'idref',
            status: 'linked',
            field: 'pid',
            value: '104444711',
            flag: { field: 'identifiedBy', items: [viaf] },
          },
          { source: 'gnd', status: 'linked', field: 'pid', value: '001310518', flag: undefined },
        ],
      });
    });

    it('should flag the VIAF identifier written with a trailing slash or as a bare id', () => {
      for (const value of ['https://viaf.org/viaf/158765450/', '158765450']) {
        const item = { source: 'VIAF', type: 'uri', value };
        const [idref] = linking({
          ...agent,
          idref: { pid: '2', type: 'bf:Organisation', identifiedBy: [item] },
        }).sources;
        expect(idref.flag).toEqual({ field: 'identifiedBy', items: [item] });
      }
    });

    it('should report a source stating only another VIAF cluster as mismatch', () => {
      const other = { source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/999' };
      const result = linking({ ...agent, idref: { pid: '2', type: 'bf:Organisation', identifiedBy: [other] } });
      expect(statuses(result)).toEqual(['mismatch', 'linked']);
      expect(result.sources[0].flag).toBeUndefined();
    });

    it('should not link the agents without VIAF cluster', () => {
      const result = linking({
        pid: '1',
        type: 'bf:Person',
        sources: ['rero'],
        rero: { pid: 'A1', type: 'bf:Person' },
      });
      expect(result.hub).toBeUndefined();
      // The source pid is not a link key
      expect(result.sources).toEqual([{ source: 'rero', status: 'missing' }]);
    });
  });

  describe('places', () => {
    const gndPid = { source: 'GND', type: 'bf:Nbn', value: '(DE-101)130692220' };
    const place = (identifiedBy: unknown[]): EntityMetadata => ({
      pid: '16773276',
      type: 'bf:Place',
      sources: ['gnd', 'idref'],
      gnd: { pid: '130692220', type: 'bf:Place' },
      idref: { pid: '028907493', type: 'bf:Place', identifiedBy },
    });

    it('should link the places by the GND PID, without the (DE-101) prefix', () => {
      expect(linking(place([gndPid, { source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/1' }]))).toEqual({
        category: 'places',
        method: 'GND PID',
        key: '130692220',
        sources: [
          {
            source: 'gnd',
            status: 'linked',
            field: 'pid',
            value: '130692220',
            keys: ['130692220'],
            pid: '130692220',
            flag: { field: 'pid', items: ['130692220'] },
          },
          {
            source: 'idref',
            status: 'linked',
            field: 'identifiedBy (GND)',
            value: '(DE-101)130692220',
            keys: ['130692220'],
            pid: '028907493',
            flag: { field: 'identifiedBy', items: [gndPid] },
          },
        ],
      });
    });

    it('should flag the sources carrying different keys', () => {
      const result = linking(place([{ ...gndPid, value: '(DE-101)9' }]));
      expect(result.key).toBeUndefined();
      expect(statuses(result)).toEqual(['mismatch', 'mismatch']);
    });

    it('should not report a key that no other source shares as linked', () => {
      const result = linking(place([]));
      expect(result.key).toBeUndefined();
      expect(statuses(result)).toEqual(['unshared', 'missing']);
      // Not flagged: the key links nothing
      expect(result.sources[0]).toEqual({
        source: 'gnd',
        status: 'unshared',
        field: 'pid',
        value: '130692220',
        keys: ['130692220'],
        pid: '130692220',
        flag: undefined,
      });
    });

    it('should report the IdRef places stating several GND PIDs as ambiguous, not linked by MEF', () => {
      const result = linking(place([gndPid, { ...gndPid, value: '(DE-101)9' }, gndPid]));
      expect(statuses(result)).toEqual(['unshared', 'ambiguous']);
      expect(result.sources[1]).toEqual({
        source: 'idref',
        status: 'ambiguous',
        field: 'identifiedBy (GND)',
        value: '(DE-101)130692220, (DE-101)9',
        keys: ['130692220', '9'],
        pid: '028907493',
        flag: undefined,
      });
    });
  });

  describe('concepts', () => {
    const bnfId = (value: string) => ({ source: 'BNF', type: 'bf:Nbn', value });
    const bnf = (name: string, value: string) => ({
      authorized_access_point: name,
      source: 'BNF',
      identifiedBy: [bnfId(value)],
    });
    const concept = (gnd: Record<string, unknown>, idref = [bnfId('FRBNF17049343')]): EntityMetadata => ({
      pid: '1',
      type: 'bf:Topic',
      sources: ['idref', 'gnd', 'rero'],
      idref: { pid: '19361801X', type: 'bf:Topic', identifiedBy: idref },
      gnd: { pid: '1183616678', type: 'bf:Topic', ...gnd },
      rero: { pid: 'A1', type: 'bf:Topic' },
    });

    it('should link the concepts by the BNF identifier of the exact matches, RERO excluded', () => {
      const exact = bnf('Other', 'FRBNF17049343');
      const [exactId] = exact.identifiedBy;
      const result = linking(concept({ exactMatch: [exact], closeMatch: [bnf('Close', 'FRBNF22222222')] }));
      expect(result.key).toBe('FRBNF17049343');
      expect(result.sources).toEqual([
        {
          source: 'idref',
          status: 'linked',
          field: 'identifiedBy (BNF)',
          value: 'FRBNF17049343',
          keys: ['FRBNF17049343'],
          pid: '19361801X',
          flag: { field: 'identifiedBy', items: [bnfId('FRBNF17049343')] },
        },
        {
          source: 'gnd',
          status: 'linked',
          field: 'exactMatch (BNF)',
          value: 'FRBNF17049343',
          keys: ['FRBNF17049343'],
          pid: '1183616678',
          flag: { field: 'exactMatch', items: [exactId] },
        },
        { source: 'rero', status: 'excluded' },
      ]);
    });

    it('should compare the BNF numbers without their check character', () => {
      const result = linking(concept({ exactMatch: [bnf('A', 'FRBNF17049343X')] }));
      expect(result.key).toBe('FRBNF17049343');
      expect(result.sources[1]).toMatchObject({ status: 'linked', value: 'FRBNF17049343X' });
    });

    it('should link an IdRef record carrying several BNF numbers by the one GND shares', () => {
      const result = linking(
        concept({ exactMatch: [bnf('A', 'FRBNF17049343')] }, [bnfId('FRBNF11111111'), bnfId('FRBNF17049343')]),
      );
      expect(result.key).toBe('FRBNF17049343');
      expect(result.sources[0]).toMatchObject({ status: 'linked', value: 'FRBNF17049343' });
    });

    it('should flag the BNF identifier of all the GND matches carrying the shared BNF number', () => {
      const [first, second] = [bnf('A', 'FRBNF17049343'), bnf('B', 'FRBNF17049343X')];
      expect(linking(concept({ exactMatch: [first, second] })).sources[1]).toEqual({
        source: 'gnd',
        status: 'linked',
        field: 'exactMatch (BNF)',
        value: 'FRBNF17049343, FRBNF17049343X',
        keys: ['FRBNF17049343'],
        pid: '1183616678',
        flag: { field: 'exactMatch', items: [...first.identifiedBy, ...second.identifiedBy] },
      });
    });

    it('should display all the BNF numbers of an IdRef record not linked', () => {
      const result = linking(
        concept({ exactMatch: [bnf('A', 'FRBNF33333333')] }, [bnfId('FRBNF11111111'), bnfId('FRBNF22222222')]),
      );
      expect(result.sources[0]).toMatchObject({ status: 'mismatch', value: 'FRBNF11111111, FRBNF22222222' });
    });

    it('should fall back to the close matches only without BNF number in the exact matches', () => {
      expect(linking(concept({ closeMatch: [bnf('Close', 'FRBNF17049343')] })).sources[1]).toMatchObject({
        status: 'linked',
        field: 'closeMatch (BNF)',
      });
    });

    it('should report a GND record whose matches carry different BNF numbers as ambiguous, not linked by MEF', () => {
      for (const field of ['exactMatch', 'closeMatch']) {
        const result = linking(concept({ [field]: [bnf('A', 'FRBNF17049343'), bnf('B', 'FRBNF22222222')] }));
        expect(statuses(result)).toEqual(['unshared', 'ambiguous', 'excluded']);
        expect(result.sources[1]).toMatchObject({ field: `${field} (BNF)`, value: 'FRBNF17049343, FRBNF22222222' });
      }
    });

    it('should not fall back to the close matches when the exact matches are ambiguous, as MEF', () => {
      const result = linking(
        concept({
          exactMatch: [bnf('A', 'FRBNF11111111'), bnf('B', 'FRBNF22222222')],
          closeMatch: [bnf('C', 'FRBNF17049343')],
        }),
      );
      expect(result.sources[1]).toMatchObject({ status: 'ambiguous', field: 'exactMatch (BNF)' });
    });
  });
});

describe('carrierSearch', () => {
  const unshared: RecordLinking = {
    category: 'concepts',
    method: 'BNF identifier',
    sources: [{ source: 'gnd', status: 'unshared', value: 'FRBNF11932434', keys: ['FRBNF11932434'], pid: '041556208' }],
  };

  it('should search the records carrying the keys of a single unshared source, in the linked sources', () => {
    expect(carrierSearch(unshared)).toEqual({
      category: 'concepts',
      keys: ['FRBNF11932434'],
      sources: ['gnd', 'idref'],
      source: 'gnd',
      pid: '041556208',
    });
  });

  it('should not search for a linked record, the agents, or without unshared key', () => {
    expect(carrierSearch({ ...unshared, key: 'FRBNF11932434' })).toBeUndefined();
    expect(carrierSearch({ ...unshared, category: 'agents' })).toBeUndefined();
    expect(carrierSearch({ ...unshared, sources: [{ source: 'gnd', status: 'missing' }] })).toBeUndefined();
  });
});

describe('contestedLinking', () => {
  const key = 'FRBNF11932434';
  const linking: RecordLinking = {
    category: 'concepts',
    method: 'BNF identifier',
    sources: [
      { source: 'idref', status: 'unshared', value: key, keys: [key], pid: '02723875X' },
      { source: 'rero', status: 'excluded' },
    ],
  };
  const search: CarrierSearch = {
    category: 'concepts',
    keys: [key],
    sources: ['gnd', 'idref'],
    source: 'idref',
    pid: '02723875X',
  };
  const idref: KeyCarrier = { source: 'idref', pid: '02723875X', keys: [key] };
  const gnd = (pid: string, level = 'closeMatch'): KeyCarrier => ({ source: 'gnd', pid, keys: [key], level });

  it('should report several records of the other source without exact match as contested', () => {
    const result = contestedLinking(linking, search, [gnd('1'), gnd('2'), idref], '14564678');
    expect(result.sources.map(({ status }) => status)).toEqual(['contested', 'excluded']);
    expect(result.conflict).toBe('gnd');
    expect(result.carriers?.map(({ current }) => current)).toEqual([false, false, true]);
  });

  it('should not report a key that MEF links: single exact match, or single record of the other source', () => {
    expect(contestedLinking(linking, search, [gnd('1', 'exactMatch'), gnd('2'), idref], '14564678')).toBe(linking);
    expect(contestedLinking(linking, search, [gnd('1'), idref], '14564678')).toBe(linking);
    expect(contestedLinking(linking, search, [idref], '14564678')).toBe(linking);
  });

  it('should report a key carried by several records of the own source as contested', () => {
    const other: KeyCarrier = { ...idref, pid: '9', mef: { pid: '1', link: '/concepts/detail/1' } };
    const result = contestedLinking(linking, search, [idref, other], '14564678');
    expect(result.conflict).toBe('idref');
    expect(result.carriers?.map(({ current }) => current)).toEqual([true, false]);
  });

  it('should tell the own source record by its pid, without its MEF record', () => {
    expect(contestedLinking(linking, search, [{ ...idref, mef: undefined }], '14564678')).toBe(linking);
  });
});
