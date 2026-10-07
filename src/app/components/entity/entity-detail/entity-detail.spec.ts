// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecordService } from '@rero/ng-core';

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
        gnd: { pid: '123', type: 'bf:Person', authorized_access_point: 'Doe, John' },
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
    expect(tabs).toEqual(['GND', 'IdRef']);
    // Fields of the first source, in the API order
    const gndValues = [...element.querySelectorAll('p-tabpanel')[0].querySelectorAll('dd')].map((value) =>
      value.textContent?.trim(),
    );
    expect(gndValues).toEqual(['123', 'bf:Person', 'Doe, John']);
  });
});
