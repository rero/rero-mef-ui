// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeSearch } from '../home-search/home-search';
import { Menu } from '../menu/menu';
import { ThemeSwitch } from '../theme-switch/theme-switch';

/**
 * Application header.
 * - `large` (home page): navigation bar, then the MEF logo, the description and the search field;
 * - compact (search and detail pages): one bar with the MEF logo, linked to the home page, and
 *   the navigation.
 */
@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink, HomeSearch, Menu, ThemeSwitch],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly large = input(false);
}
