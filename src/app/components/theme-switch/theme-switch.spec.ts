// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeService } from '../../theme.service';
import { ThemeSwitch } from './theme-switch';

describe('ThemeSwitch', () => {
  let fixture: ComponentFixture<ThemeSwitch>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ThemeSwitch] }).compileComponents();
    fixture = TestBed.createComponent(ThemeSwitch);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => document.documentElement.classList.remove('app-dark'));

  const current = () => element.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  const options = () => element.querySelector<HTMLElement>('#theme-switch-options')!;
  const otherButtons = () => [...options().querySelectorAll('button')];

  it('should display the current mode, the other ones being collapsed', () => {
    expect(current().textContent?.trim()).toBe('Color theme: Automatic (system setting)');
    expect(current().getAttribute('aria-expanded')).toBe('false');
    expect(options().hasAttribute('inert')).toBe(true);
    expect(otherButtons().map((button) => button.textContent?.trim())).toEqual(['Light', 'Dark']);
  });

  it('should expand the other modes on click, and select one', async () => {
    current().click();
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('true');
    expect(options().hasAttribute('inert')).toBe(false);

    otherButtons()[1].click();
    await fixture.whenStable();
    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    expect(current().textContent?.trim()).toBe('Color theme: Dark');
    expect(current().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(current());
  });

  it('should expand on mouse over only, not on touch', async () => {
    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('false');

    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('true');

    element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('false');
  });

  it('should stay expanded after a selection with the mouse, until the mouse leaves', async () => {
    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await fixture.whenStable();

    otherButtons()[1].dispatchEvent(new PointerEvent('click', { pointerType: 'mouse', bubbles: true }));
    await fixture.whenStable();
    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
    expect(current().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(current());

    element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('false');
  });

  it('should collapse with the Escape key', async () => {
    current().click();
    await fixture.whenStable();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(current().getAttribute('aria-expanded')).toBe('false');
  });
});
