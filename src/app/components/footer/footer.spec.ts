// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { version } from '../../../../package.json';
import { Footer, release } from './footer';

describe('release', () => {
  it('should link a version to its GitHub release', () => {
    expect(release('rero-mef', '1.0.5')).toEqual({
      label: 'rero-mef v1.0.5',
      url: 'https://github.com/rero/rero-mef/releases/tag/v1.0.5',
    });
  });
});

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
    httpTesting.expectOne('/api/version').flush({ version: '1.0.5' });
    await fixture.whenStable();
  });

  it('should display the RERO+ brand, linked to its website', () => {
    const brand = element.querySelector('a[href="https://www.rero.ch"]');
    expect(brand?.textContent).toContain('A service of');
    expect(brand?.querySelector('img')?.getAttribute('alt')).toBe('RERO+');
  });

  it('should display the versions of the UI and of the backend, linked to their release', () => {
    const versions = [...element.querySelectorAll('[aria-label="Versions"] a')].map(
      (link) => `${link.firstChild?.textContent?.trim()} ${link.getAttribute('href')}`,
    );
    expect(versions).toEqual([
      `rero-mef-ui v${version} https://github.com/rero/rero-mef-ui/releases/tag/v${version}`,
      'rero-mef v1.0.5 https://github.com/rero/rero-mef/releases/tag/v1.0.5',
    ]);
  });
});
