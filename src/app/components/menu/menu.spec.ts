// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Menu } from './menu';

describe('Menu', () => {
  let component: Menu;
  let fixture: ComponentFixture<Menu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Menu],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Menu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main menu entries', () => {
    const labels = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.p-menubar-item-label')].map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toEqual(expect.arrayContaining(['How linking works', 'API']));
    expect(labels).not.toContain('Home');
  });

  it('should open the API links in a new tab', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const api = [...element.querySelectorAll<HTMLElement>('.p-menubar-item-content')].find(
      (item) => item.textContent?.trim() === 'API',
    )!;
    api.click();
    await fixture.whenStable();

    const links = [...element.querySelectorAll<HTMLAnchorElement>('a[href^="/api/"]')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/api/agents/mef/',
      '/api/concepts/mef/',
      '/api/places/mef/',
    ]);
    expect(links.every((link) => link.target === '_blank')).toBe(true);
  });
});
