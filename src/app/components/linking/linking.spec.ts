// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Linking } from './linking';

describe('Linking', () => {
  let component: Linking;
  let fixture: ComponentFixture<Linking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Linking],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Linking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should link each section from the "On this page" navigation', () => {
    const element = fixture.nativeElement as HTMLElement;
    const fragments = [...element.querySelectorAll('nav[aria-label="On this page"] a')].map(
      (link) => link.getAttribute('href')?.split('#')[1],
    );
    expect(fragments).toEqual(['agents', 'concepts', 'places', 'redirects']);
    for (const fragment of fragments) {
      expect(element.querySelector(`section#${fragment} h2`)).not.toBeNull();
    }
  });

  it('should link the browse buttons to the search, filtered on the entity', () => {
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a[pButton]')].map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/mef?entity=agents', '/mef?entity=concepts', '/mef?entity=places']);
  });
});
