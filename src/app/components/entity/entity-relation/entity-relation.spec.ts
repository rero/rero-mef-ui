// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecordService } from '@rero/ng-core';
import { of } from 'rxjs';

import { EntityRelation } from './entity-relation';

describe('EntityRelation', () => {
  let fixture: ComponentFixture<EntityRelation>;
  let element: HTMLElement;
  const getRecords = vi.fn(() =>
    of({
      hits: {
        hits: [
          {
            metadata: {
              pid: '42',
              type: 'bf:Person',
              sources: ['gnd'],
              gnd: { pid: '003050076', authorized_access_point: 'Goethe, Johann Wolfgang von' },
            },
          },
        ],
        total: { value: 1 },
      },
    }),
  );

  beforeEach(async () => {
    getRecords.mockClear();
    await TestBed.configureTestingModule({
      imports: [EntityRelation],
      providers: [provideRouter([]), { provide: RecordService, useValue: { getRecords } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityRelation);
    fixture.componentRef.setInput('entityType', 'agents');
    fixture.componentRef.setInput('source', 'gnd');
    fixture.componentRef.setInput('pid', '003050076');
    fixture.componentRef.setInput('icon', {
      class: 'fa-solid fa-circle-right',
      label: 'Redirect to',
    });
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should not search before the panel is expanded', () => {
    expect(getRecords).not.toHaveBeenCalled();
    expect(element.querySelector<HTMLElement>('p-accordion-header')?.getAttribute('aria-expanded')).toBe('false');
    expect(element.textContent).toContain('003050076');
  });

  it('should search the related records in the entity type index when expanded', async () => {
    element.querySelector<HTMLElement>('p-accordion-header')?.click();
    await fixture.whenStable();

    expect(getRecords).toHaveBeenCalledWith('agents/mef', {
      query: 'gnd.pid:003050076',
      itemsPerPage: 20,
    });
    const link = element.querySelector('li a');
    expect(link?.textContent?.trim()).toBe('Goethe, Johann Wolfgang von');
    expect(link?.getAttribute('href')).toBe('/agents/detail/42');
  });

  it('should search when the panel is expanded with the keyboard', async () => {
    element.querySelector('p-accordion-header')?.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await fixture.whenStable();

    expect(getRecords).toHaveBeenCalledTimes(1);
  });

  it('should not search again when the panel is collapsed and expanded again', async () => {
    const button = element.querySelector<HTMLElement>('p-accordion-header');
    button?.click();
    await fixture.whenStable();
    button?.click();
    await fixture.whenStable();
    button?.click();
    await fixture.whenStable();

    expect(getRecords).toHaveBeenCalledTimes(1);
    expect(element.querySelector('li a')).not.toBeNull();
  });
});
