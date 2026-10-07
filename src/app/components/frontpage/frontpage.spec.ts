// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecordService } from '@rero/ng-core';
import { of } from 'rxjs';

import { Frontpage } from './frontpage';

describe('Frontpage', () => {
  let fixture: ComponentFixture<Frontpage>;
  const getRecords = vi.fn(() =>
    of({
      aggregations: {
        entity: {
          buckets: [
            { key: 'agents', doc_count: 13762270 },
            { key: 'places', doc_count: 486878 },
            { key: 'concepts', doc_count: 432609 },
          ],
        },
      },
    }),
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Frontpage],
      providers: [provideRouter([]), { provide: RecordService, useValue: { getRecords } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Frontpage);
    await fixture.whenStable();
  });

  it('should display the number of records of each entity type', () => {
    expect(getRecords).toHaveBeenCalledWith('all/mef', { itemsPerPage: 1, facets: ['entity'] });
    const cards = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('[aria-labelledby="entities-title"] li h3'),
    ].map((title) => title.parentElement?.textContent?.replace(/\s+/g, ' ').trim());
    expect(cards).toEqual(['Agents 13,762,270 records', 'Concepts 432,609 records', 'Places 486,878 records']);
  });

  it('should display the other RERO+ products, opened in a new window', () => {
    const products = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('[aria-labelledby="products-title"] a'),
    ];
    expect(products.map((link) => link.getAttribute('href'))).toEqual(['https://bib.rero.ch', 'https://sonar.rero.ch']);
    expect(products.every((link) => link.getAttribute('target') === '_blank')).toBe(true);
    expect(products[0].textContent).toContain('RERO ILS');
  });

  it('should link each entity type to the search, filtered on the entity', () => {
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a[href^="/mef"]')].map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/mef?entity=agents', '/mef?entity=concepts', '/mef?entity=places']);
  });
});
