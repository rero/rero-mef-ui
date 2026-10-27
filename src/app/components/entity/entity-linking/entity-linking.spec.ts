// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RecordLinking } from '../record-linking';
import { diagramArrows, EntityLinking, linkingSummary } from './entity-linking';

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
});

describe('EntityLinking', () => {
  it('should display the sources with their link key and status, and the MEF record', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EntityLinking);
    fixture.componentRef.setInput('linking', places);
    fixture.componentRef.setInput('pid', '16773276');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

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
  });
});
