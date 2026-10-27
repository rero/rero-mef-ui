// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecordService } from '@rero/ng-core';
import { of } from 'rxjs';

import { KeyCarrier, RecordLinking } from '../record-linking';
import { diagramArrows, EntityLinking, linkingSummary } from './entity-linking';

/** GND concept whose BNF number is carried by another GND record too. */
const carriers: KeyCarrier[] = [
  { source: 'gnd', pid: '041556208', keys: ['FRBNF11932434'], level: 'closeMatch', current: true },
  {
    source: 'gnd',
    pid: '040379442',
    name: 'Mathematik',
    keys: ['FRBNF11932434'],
    level: 'closeMatch',
    mef: { pid: '18730135', link: '/concepts/detail/18730135' },
  },
];
const contested: RecordLinking = {
  category: 'concepts',
  method: 'BNF identifier',
  sources: [
    {
      source: 'gnd',
      status: 'contested',
      field: 'closeMatch (BNF)',
      value: 'FRBNF11932434',
      keys: ['FRBNF11932434'],
    },
  ],
  carriers,
  conflict: 'gnd',
};

const places: RecordLinking = {
  category: 'places',
  method: 'GND PID',
  key: '130692220',
  sources: [
    { source: 'gnd', status: 'linked', field: 'pid', value: '130692220' },
    { source: 'idref', status: 'linked', field: 'identifiedBy (GND)', value: '(DE-101)130692220' },
  ],
};

describe('linkingSummary', () => {
  it('should summarize the linking of the agents', () => {
    const agents: RecordLinking = { category: 'agents', method: 'VIAF cluster', sources: [] };
    expect(linkingSummary({ ...agents, hub: '1', key: '1' })).toBe('The sources are linked by their VIAF cluster 1.');
    expect(linkingSummary(agents)).toBe('No VIAF cluster: the sources are not linked by VIAF.');
    expect(
      linkingSummary({ ...agents, hub: '1', key: '1', sources: [{ source: 'idref', status: 'mismatch', value: '2' }] }),
    ).toBe('The sources are linked by their VIAF cluster 1, but IdRef states another VIAF cluster.');
    expect(
      linkingSummary({
        ...agents,
        hub: '1',
        key: '1',
        sources: [
          { source: 'gnd', status: 'mismatch' },
          { source: 'idref', status: 'mismatch' },
        ],
      }),
    ).toBe('The sources are linked by their VIAF cluster 1, but GND and IdRef state other VIAF clusters.');
  });

  it('should summarize the linking by a shared identifier', () => {
    expect(linkingSummary(places)).toBe('The 2 sources share the same GND PID: 130692220.');
    expect(
      linkingSummary({
        ...places,
        key: undefined,
        sources: [
          { ...places.sources[0], status: 'unshared' },
          { source: 'idref', status: 'missing' },
        ],
      }),
    ).toBe('Only GND carries a GND PID: 130692220.');
    expect(
      linkingSummary({
        ...places,
        key: undefined,
        sources: places.sources.map((source) => ({ ...source, status: 'mismatch' })),
      }),
    ).toBe('The sources carry different GND PIDs: check the source records.');
    expect(
      linkingSummary({
        ...places,
        key: undefined,
        sources: [
          { ...places.sources[0], status: 'unshared' },
          { source: 'idref', status: 'ambiguous', value: '(DE-101)1, (DE-101)2' },
        ],
      }),
    ).toBe('IdRef states several different GND PIDs: MEF does not link it.');
    expect(
      linkingSummary({
        ...places,
        key: undefined,
        sources: [
          { source: 'gnd', status: 'ambiguous' },
          { source: 'idref', status: 'ambiguous' },
        ],
      }),
    ).toBe('GND and IdRef state several different GND PIDs: MEF does not link them.');
    expect(linkingSummary({ ...places, key: undefined, sources: [] })).toBe('No source carries a GND PID.');
  });

  it('should summarize a key carried by other records', () => {
    expect(linkingSummary(contested)).toBe(
      '1 other record carries the same BNF identifier: MEF links none of them. Only a single GND exactMatch would decide.',
    );
    // Several IdRef records: an exact match decides nothing; several keys: one of them is carried
    const idref: KeyCarrier = { source: 'idref', pid: '02723875X', keys: ['FRBNF1'] };
    const [source] = contested.sources;
    expect(
      linkingSummary({
        ...contested,
        sources: [{ ...source, source: 'idref', keys: ['FRBNF1', 'FRBNF2'] }],
        carriers: [{ ...idref, current: true }, idref, { ...idref, pid: '1' }],
        conflict: 'idref',
      }),
    ).toBe('2 other records carry one of its BNF identifiers: MEF links none of them.');
  });
});

describe('diagramArrows', () => {
  it('should go through the VIAF hub for the agents', () => {
    const agents: RecordLinking = { category: 'agents', method: 'VIAF cluster', sources: [] };
    expect(diagramArrows({ ...agents, hub: '1' })).toEqual({ hub: {}, mef: { label: 'viaf_pid', broken: false } });
    expect(diagramArrows(agents).mef).toEqual({ label: 'viaf_pid', broken: true });
  });

  it('should label the arrow to MEF when the sources share a key', () => {
    expect(diagramArrows(places)).toEqual({ mef: { label: 'same key' } });
    expect(diagramArrows({ ...places, key: undefined })).toEqual({ mef: { label: undefined } });
  });

  it('should break the arrow to MEF when other records carry the key', () => {
    expect(diagramArrows(contested)).toEqual({ mef: { label: 'several records', broken: true } });
  });
});

describe('EntityLinking', () => {
  const getRecords = vi.fn();

  /** Card of a linking, rendered. */
  async function render(linking: RecordLinking, pid: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RecordService, useValue: { getRecords } }],
    });
    const fixture = TestBed.createComponent(EntityLinking);
    fixture.componentRef.setInput('linking', linking);
    fixture.componentRef.setInput('pid', pid);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => vi.resetAllMocks());

  it('should display the sources with their link key and status, and the MEF record', async () => {
    const element = await render(places, '16773276');

    // Source, field, link key and status of each source
    const items = [...element.querySelectorAll('ol[aria-label="Sources"] li')].map((item) =>
      [':scope > p-tag', ':scope > span > span', 'code', ':scope > span:last-child'].map((selector) =>
        item.querySelector(selector)?.textContent?.trim(),
      ),
    );
    expect(items).toEqual([
      ['GND', 'pid', '130692220', 'Linked'],
      ['IdRef', 'identifiedBy (GND)', '(DE-101)130692220', 'Linked'],
    ]);
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/linking#places');
    expect(element.textContent).toContain('16773276');
    expect(element.textContent).toContain('The 2 sources share the same GND PID: 130692220.');
    // Linked: the other records carrying the key are not searched
    expect(getRecords).not.toHaveBeenCalled();
  });

  it('should list the other records carrying the key of an unshared source', async () => {
    const hits = (metadata: unknown[]) =>
      of({ hits: { hits: metadata.map((item) => ({ metadata: item })), total: 0 } });
    getRecords.mockImplementation((index: string) => {
      switch (index) {
        case 'concepts/gnd':
          return hits([
            {
              pid: '041556208',
              authorized_access_point: 'Mathematische Methode',
              _association_identifier: ['FRBNF11932434'],
              _association_level: 'closeMatch',
            },
            {
              pid: '040379442',
              authorized_access_point: 'Mathematik',
              _association_identifier: ['FRBNF11932434'],
              _association_level: 'closeMatch',
            },
          ]);
        case 'concepts/mef':
          return hits([
            { pid: '18105349', type: 'bf:Topic', gnd: { pid: '041556208' } },
            { pid: '18730135', type: 'bf:Topic', gnd: { pid: '040379442' } },
          ]);
        default:
          return hits([]);
      }
    });
    const element = await render(
      {
        category: 'concepts',
        method: 'BNF identifier',
        sources: [
          {
            source: 'gnd',
            status: 'unshared',
            field: 'closeMatch (BNF)',
            value: 'FRBNF11932434',
            keys: ['FRBNF11932434'],
            pid: '041556208',
          },
        ],
      },
      '18105349',
    );

    expect(element.querySelector('ol[aria-label="Sources"] li')?.textContent).toContain('Several records');
    const rows = [...element.querySelectorAll('ul[aria-labelledby="linking-carriers"] li')].map((item) =>
      [...item.children].map((child) => child.textContent?.trim()),
    );
    expect(rows).toEqual([
      ['GND', 'Mathematische Methode', '041556208', 'closeMatch', 'This record'],
      ['GND', 'Mathematik', '040379442', 'closeMatch', 'MEF 18730135'],
    ]);
    expect(element.querySelector('a[href="/concepts/detail/18730135"]')).not.toBeNull();
    expect(element.textContent).toContain('1 other record carries the same BNF identifier: MEF links none of them.');
  });
});
