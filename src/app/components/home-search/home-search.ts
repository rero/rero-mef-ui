// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';

/**
 * Search field of the home page: opens the MEF search (brief view) with the query, e.g.
 * `/mef?q=Goethe`. An empty query opens the search without query, as empty searches are allowed.
 */
@Component({
  selector: 'app-home-search',
  imports: [ReactiveFormsModule, Button, InputGroup, InputGroupAddon, InputText],
  templateUrl: './home-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSearch {
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({ q: new FormControl('', { nonNullable: true }) });

  /**
   * RERO+ blue button: white text with a sufficient contrast (WCAG AA) on the header blue. In dark
   * mode, the colors of the other PrimeNG buttons (light primary blue, dark text).
   */
  protected readonly buttonPt = {
    root: {
      class: [
        'rounded-l-none border-[#1765a2] bg-[#1765a2] text-white hover:border-[#12568c] hover:bg-[#12568c]',
        'dark:border-(--p-primary-color) dark:bg-(--p-primary-color) dark:text-(--p-primary-contrast-color)',
        'dark:hover:border-(--p-primary-hover-color) dark:hover:bg-(--p-primary-hover-color)',
      ].join(' '),
    },
  };

  protected search(): void {
    const q = this.form.controls.q.value.trim();
    void this.router.navigate(['/mef'], { queryParams: q ? { q } : {} });
  }
}
