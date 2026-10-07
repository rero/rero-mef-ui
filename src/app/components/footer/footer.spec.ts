// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';

import { Footer } from './footer';

describe('Footer', () => {
  it('should display the RERO+ brand, linked to its website', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const brand = element.querySelector('a[href="https://www.rero.ch"]');
    expect(brand?.textContent).toContain('A service of');
    expect(brand?.querySelector('img')?.getAttribute('alt')).toBe('RERO+');
  });
});
