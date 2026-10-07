// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

import { ENTITY_CATEGORIES } from '../entity/entity.model';

/** Light text color of the header navigation on hover / focus. */
const HOVER_COLOR = '#dbe9f5';

/** Text color of the dropdown items: MEF blue on white (semantic colors of `styles.css`). */
const ITEM_COLOR = 'var(--color-heading)';

/** Background of the dropdown items on hover / focus, as the icon badges of the home page. */
const ITEM_HOVER_BACKGROUND = 'var(--color-surface-accent)';

/** Main navigation of the header, built with the PrimeNG Menubar. */
@Component({
  selector: 'app-menu',
  imports: [Menubar],
  templateUrl: './menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Menu {
  private readonly menubar = viewChild.required(Menubar);

  protected readonly items: MenuItem[] = [
    { label: 'How linking works', routerLink: '/linking' },
    {
      label: 'API',
      // Raw JSON of the API: in a new tab, so that the application stays open; external link icon
      // after the label, aligned on the right (`order-last`, `ms-auto` in the flex link)
      items: ENTITY_CATEGORIES.map(({ key, title }) => ({
        label: title,
        url: `/api/${key}/mef/`,
        target: '_blank',
        icon: 'fa-solid fa-up-right-from-square',
        iconClass: 'order-last ms-auto text-xs',
      })),
    },
  ];

  /**
   * Menubar design tokens: white dropdowns with blue items, which stand out from the header blue
   * and from the page content. The `item` tokens also apply to the items of the bar: on desktop,
   * they are displayed in white on the header blue by `app-menu` rules of `styles.css`. On mobile,
   * the whole menu opens in a white panel, with the dropdown colors.
   */
  protected readonly tokens = {
    root: { background: 'transparent', borderColor: 'transparent', padding: '0' },
    item: {
      color: ITEM_COLOR,
      focusColor: ITEM_COLOR,
      activeColor: ITEM_COLOR,
      focusBackground: ITEM_HOVER_BACKGROUND,
      activeBackground: ITEM_HOVER_BACKGROUND,
      icon: { color: ITEM_COLOR, focusColor: ITEM_COLOR, activeColor: ITEM_COLOR },
    },
    submenu: {
      background: 'var(--color-surface)',
      borderColor: 'var(--color-line)',
      shadow: '0 8px 24px rgb(26 65 98 / 0.15)',
      icon: { color: ITEM_COLOR, focusColor: ITEM_COLOR, activeColor: ITEM_COLOR },
    },
    mobileButton: {
      color: '#ffffff',
      hoverColor: HOVER_COLOR,
      hoverBackground: 'rgb(255 255 255 / 0.1)',
    },
  };

  /**
   * Opens the submenus on mouse over on desktop. PrimeNG only does it after a first click
   * (`dirty` flag); on mobile (`queryMatches`), the menu keeps opening on click.
   */
  protected openOnHover(): void {
    const menubar = this.menubar();
    if (!menubar.queryMatches()) {
      menubar.dirty = true;
    }
  }
}
