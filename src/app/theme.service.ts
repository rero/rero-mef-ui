// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

/** Color theme chosen by the user: `auto` follows the system setting (`prefers-color-scheme`). */
export type ThemeMode = 'auto' | 'light' | 'dark';

/** Storage key of the chosen mode, also read by the inline script of `index.html`. */
const STORAGE_KEY = 'mef-theme';

/** Class of the `<html>` element enabling the dark mode (PrimeNG and Tailwind `dark:`). */
const DARK_CLASS = 'app-dark';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

/** Light / dark color theme of the application. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly mode = signal<ThemeMode>(this.storedMode());

  /** True when the dark theme is displayed. */
  readonly dark = computed(() => this.mode() === 'dark' || (this.mode() === 'auto' && this.systemDark()));

  constructor() {
    this.media?.addEventListener('change', (event) => this.systemDark.set(event.matches));
    effect(() => this.document.documentElement.classList.toggle(DARK_CLASS, this.dark()));
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage unavailable (private browsing...): the mode is kept until the page is reloaded
    }
  }

  private storedMode(): ThemeMode {
    try {
      const mode = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return isThemeMode(mode) ? mode : 'auto';
    } catch {
      return 'auto';
    }
  }
}
