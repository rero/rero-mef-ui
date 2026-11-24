// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ApiStatus } from './api-status.service';
import { App } from './app';

/** Page of the routes, counting its creations. */
@Component({ template: '<h1>Page</h1>' })
class Page {
  static created = 0;

  constructor() {
    Page.created++;
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([{ path: '', component: Page }])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the compact header outside of the home page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header a[aria-label="MEF home"]')).not.toBeNull();
    expect(compiled.querySelector('header h1')).toBeNull();
  });

  it('should render the large header on the home page', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header h1 img')?.getAttribute('alt')).toBe('MEF – Multilingual Entity File');
  });

  it('should render the error page instead of the current one while the API is unavailable', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    TestBed.inject(ApiStatus).reportUnavailable(0, TestBed.inject(ApiStatus).attempt);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main router-outlet')).toBeNull();
    expect(compiled.querySelector('main h1')?.textContent?.trim()).toBe('Server unreachable');
  });

  it('should display the current page again on retry, which requests the API again', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const created = Page.created;
    TestBed.inject(ApiStatus).reportUnavailable(0, TestBed.inject(ApiStatus).attempt);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const retry = [...compiled.querySelectorAll('main button')].find((button) =>
      button.textContent?.includes('Try again'),
    ) as HTMLButtonElement;
    retry.click();
    await fixture.whenStable();

    expect(compiled.querySelector('main h1')?.textContent?.trim()).toBe('Page');
    expect(Page.created).toBe(created + 1);
  });
});
