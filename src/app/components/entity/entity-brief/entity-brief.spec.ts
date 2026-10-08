// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { spokenText } from '../../../../testing/spoken-text';
import { EntityRecord } from '../entity.model';
import { EntityBrief } from './entity-brief';

describe('EntityBrief', () => {
  let component: EntityBrief;
  let fixture: ComponentFixture<EntityBrief>;

  const record: EntityRecord = {
    id: '1',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-02T00:00:00Z',
    links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
    metadata: {
      pid: '1',
      type: 'bf:Person',
      sources: ['gnd'],
      gnd: { pid: '123', type: 'bf:Person', authorized_access_point: 'Doe, John' },
      authorized_access_point: 'Doe, John',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityBrief],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityBrief);
    fixture.componentRef.setInput('record', record);
    fixture.componentRef.setInput('type', 'mef');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute the name from the first source', () => {
    expect(component.name()).toBe('Doe, John');
  });

  it('should display the authorized access point', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('h3')?.textContent?.trim()).toBe('Doe, John');
  });

  it('should link the icon to the detail view, hidden from screen readers and keyboard', async () => {
    fixture.componentRef.setInput('detailUrl', { link: '/agents/detail/1', external: false });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const iconLink = element.querySelector('a:has(> app-entity-icon)');
    expect(iconLink?.getAttribute('href')).toBe(element.querySelector('h3 a')?.getAttribute('href'));
    expect(iconLink?.getAttribute('tabindex')).toBe('-1');
    expect(iconLink?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should not link the icon without detail view', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('a:has(> app-entity-icon)')).toBeNull();
  });

  it('should display the identifiers and the dates as definition lists', () => {
    const terms = [...(fixture.nativeElement as HTMLElement).querySelectorAll('dl dt')].map((term) =>
      term.textContent?.trim(),
    );
    expect(terms).toEqual(['PID', 'Created', 'Updated']);
  });

  it('should display the entity type above the name, with its icon', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(spokenText(element.querySelector('app-entity-type'))).toBe('Agent: Person');
    expect(element.querySelector('app-entity-icon i')?.className).toBe('fa-solid fa-user');
    expect(element.querySelector('app-entity-icon span')?.getAttribute('title')).toBe('Agent: Person');
    expect(element.querySelector('article')?.getAttribute('aria-labelledby')).toBe(element.querySelector('h3')?.id);
  });

  it('should highlight a deleted record', async () => {
    fixture.componentRef.setInput('record', {
      ...record,
      metadata: { ...record.metadata, deleted: '2024-02-01T00:00:00Z' },
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('article')?.classList).toContain('bg-danger-surface');
    expect(spokenText(element.querySelector('app-entity-type'))).toBe('Agent: Person, Deleted');
  });
});
