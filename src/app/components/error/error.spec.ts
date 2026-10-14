// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Error } from './error';

describe('Error', () => {
  function create(status: number, providers: unknown[] = []) {
    TestBed.configureTestingModule({ imports: [Error], providers: [provideRouter([]), ...providers] });
    const fixture = TestBed.createComponent(Error);
    fixture.componentRef.setInput('status', status);
    return fixture;
  }

  it('should display the texts of the status', async () => {
    const fixture = create(503);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Service unavailable');
    expect(element.textContent).toContain('Error 503');
  });

  it('should display the given texts and the links to go on browsing', async () => {
    const fixture = create(404);
    fixture.componentRef.setInput('title', 'Page not found');
    fixture.componentRef.setInput('description', 'The page does not exist.');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Page not found');
    expect(element.textContent).toContain('Error 404');
    expect(element.textContent).toContain('The page does not exist.');
    expect([...element.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual(['/', '/mef']);
  });

  it('should give its status to the server response', async () => {
    const response: ResponseInit = { status: 200 };
    const fixture = create(404, [{ provide: RESPONSE_INIT, useValue: response }]);
    await fixture.whenStable();
    expect(response.status).toBe(404);
  });
});
