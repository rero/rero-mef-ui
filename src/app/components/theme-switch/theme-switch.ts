// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';

import { ThemeMode, ThemeService } from '../../theme.service';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: string;
}

const OPTIONS: ThemeOption[] = [
  { value: 'auto', label: 'Automatic (system setting)', icon: 'fa-solid fa-circle-half-stroke' },
  { value: 'light', label: 'Light', icon: 'fa-solid fa-sun' },
  { value: 'dark', label: 'Dark', icon: 'fa-solid fa-moon' },
];

/**
 * Color theme selector of the header: only the current mode is displayed, in a translucent bubble. The other modes are
 * expanded on its left on mouse over, or on click (touch screens, keyboard).
 */
@Component({
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.html',
  host: {
    class: 'relative block size-9',
    '(pointerenter)': 'onPointer($event, true)',
    '(pointerleave)': 'onPointer($event, false)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'collapse(true)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitch {
  private readonly theme = inject(ThemeService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly currentButton = viewChild.required<ElementRef<HTMLButtonElement>>('currentButton');

  protected readonly expanded = signal(false);

  protected readonly current = computed(
    () => OPTIONS.find((option) => option.value === this.theme.mode()) ?? OPTIONS[0],
  );

  /** Modes displayed on the left of the current one when expanded. */
  protected readonly others = computed(() => OPTIONS.filter((option) => option.value !== this.theme.mode()));

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  protected select(mode: ThemeMode, event: MouseEvent): void {
    this.theme.setMode(mode);
    // The clicked button is hidden: the focus goes back to the current mode button
    if (event instanceof PointerEvent && event.pointerType === 'mouse') {
      // Stays expanded until the mouse leaves: collapsed, it would uncover the menu under the
      // pointer, which opens its submenu on mouse over
      this.currentButton().nativeElement.focus();
    } else {
      this.collapse(true);
    }
  }

  protected collapse(focus = false): void {
    this.expanded.set(false);
    if (focus) {
      this.currentButton().nativeElement.focus();
    }
  }

  /** Expands on mouse over only: on touch screens, the menu is opened by the click (tap). */
  protected onPointer(event: PointerEvent, enter: boolean): void {
    if (event.pointerType === 'mouse') {
      this.expanded.set(enter);
    }
  }

  /** Collapses when the focus leaves the selector (keyboard navigation). */
  protected onFocusOut(event: FocusEvent): void {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.expanded.set(false);
    }
  }
}
