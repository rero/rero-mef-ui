// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    element = fixture.nativeElement as HTMLElement;
  });

  it('should render a compact header by default, with the MEF logo linked to home', async () => {
    await fixture.whenStable();
    expect(element.querySelector('a[aria-label="MEF home"]')?.getAttribute('href')).toBe('/');
    expect(element.querySelector('h1')).toBeNull();
  });

  it('should render the MEF logo, the description and the search field when large', async () => {
    fixture.componentRef.setInput('large', true);
    await fixture.whenStable();
    expect(element.querySelector('h1 img')?.getAttribute('alt')).toBe('MEF – Multilingual Entity File');
    expect(element.textContent).toContain('linked entity hub');
    expect(element.querySelector('form[role="search"] input')).not.toBeNull();
  });
});
