// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const html = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    html.classList.remove('app-dark');
  });

  afterEach(() => html.classList.remove('app-dark'));

  it('should follow the system setting by default (light in the tests)', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.mode()).toBe('auto');
    expect(service.dark()).toBe(false);
    expect(html.classList.contains('app-dark')).toBe(false);
  });

  it('should apply and store the dark mode', () => {
    const service = TestBed.inject(ThemeService);
    service.setMode('dark');
    TestBed.tick();
    expect(html.classList.contains('app-dark')).toBe(true);
    expect(localStorage.getItem('mef-theme')).toBe('dark');

    service.setMode('light');
    TestBed.tick();
    expect(html.classList.contains('app-dark')).toBe(false);
  });

  it('should restore the stored mode', () => {
    localStorage.setItem('mef-theme', 'dark');
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.mode()).toBe('dark');
    expect(html.classList.contains('app-dark')).toBe(true);
  });

  it('should ignore an invalid stored mode', () => {
    localStorage.setItem('mef-theme', 'purple');
    expect(TestBed.inject(ThemeService).mode()).toBe('auto');
  });
});
