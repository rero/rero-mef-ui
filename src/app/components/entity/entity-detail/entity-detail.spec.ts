// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecordService } from '@rero/ng-core';

import { spokenText } from '../../../../testing/spoken-text';
import { EntityDetail } from './entity-detail';

describe('EntityDetail', () => {
  let component: EntityDetail;
  let fixture: ComponentFixture<EntityDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetail],
      providers: [provideRouter([]), { provide: RecordService, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityDetail);
    fixture.componentRef.setInput('record', {
      id: '1',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-02T00:00:00Z',
      links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
      metadata: { pid: '1', type: 'bf:Person', sources: [] },
    });
    fixture.componentRef.setInput('type', 'mef');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nothing while the record is loading', async () => {
    fixture.componentRef.setInput('record', undefined);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
    expect(component.dataType()).toBeUndefined();
  });

  it('should display the main record and one tab per source', async () => {
    fixture.componentRef.setInput('record', {
      id: '1',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-02T00:00:00Z',
      links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
      metadata: {
        pid: '1',
        type: 'bf:Person',
        sources: ['gnd', 'idref'],
        gnd: {
          pid: '123',
          type: 'bf:Person',
          authorized_access_point: 'Doe, John',
          // As in the API: `identifier` repeated in `identifiedBy`
          identifiedBy: [{ source: 'GND', type: 'uri', value: 'http://d-nb.info/gnd/123' }],
          identifier: 'http://d-nb.info/gnd/123',
          md5: 'abc',
        },
        idref: { pid: '456', type: 'bf:Person', authorized_access_point: 'Doe, J.' },
      },
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Doe, John');
    const mainTerms = [...element.querySelectorAll('[aria-labelledby="main-record-title"] dt')].map((term) =>
      term.textContent?.trim(),
    );
    expect(mainTerms).toEqual(['PID', 'Type', 'Created', 'Updated']);
    const tabs = [...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim());
    expect(tabs).toEqual(['Compare', 'GND', 'IdRef']);
    // Fields of the first source, in the API order, without the hidden ones (`identifier`, `md5`)
    const gndValues = [...element.querySelectorAll('p-tabpanel')[1].querySelectorAll('dd')].map(spokenText);
    expect(gndValues).toEqual(['123', 'bf:Person', 'Doe, John', 'http://d-nb.info/gnd/123 (opens in a new window)']);
  });

  it('should compare the sources in a first tab, with one column per source', async () => {
    fixture.componentRef.setInput('record', {
      id: '1',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-02T00:00:00Z',
      links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
      metadata: {
        pid: '1',
        type: 'bf:Person',
        sources: ['gnd', 'idref'],
        gnd: { pid: '123', type: 'bf:Person', authorized_access_point: 'Doe, John' },
        idref: { pid: '456', type: 'bf:Person', preferred_name: 'Doe, J.' },
      },
    });
    await fixture.whenStable();
    const table = (fixture.nativeElement as HTMLElement).querySelectorAll('p-tabpanel')[0].querySelector('table');

    expect([...(table?.querySelectorAll('thead th') ?? [])].map(spokenText)).toEqual(['Field', 'GND', 'IdRef']);
    const rows = [...(table?.querySelectorAll('tbody tr') ?? [])].map((row) => [...row.children].map(spokenText));
    expect(rows).toEqual([
      ['Pid', '123', '456'],
      ['Type', 'bf:Person', 'bf:Person'],
      ['Authorized access point', 'Doe, John', 'No value'],
      ['Preferred name', 'No value', 'Doe, J.'],
    ]);
  });

  it('should not compare a single source', async () => {
    fixture.componentRef.setInput('record', {
      id: '1',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-02T00:00:00Z',
      links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
      metadata: {
        pid: '1',
        type: 'bf:Person',
        sources: ['gnd'],
        gnd: { pid: '123', type: 'bf:Person', authorized_access_point: 'Doe, John' },
      },
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect([...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim())).toEqual(['GND']);
    expect(element.querySelector('table')).toBeNull();
  });
});
