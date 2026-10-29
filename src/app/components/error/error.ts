// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, computed, effect, inject, input, RESPONSE_INIT } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '@openng/optimus-ui/button';

import { errorLabel, errorText } from './error-text';

/**
 * Error page, with links to go on browsing: page of the unknown routes (inputs bound to the route
 * data) and error of the detail view. The texts depend on the HTTP status; `title` and
 * `description` replace them for a more specific message.
 */
@Component({
  selector: 'app-error',
  imports: [RouterLink, ButtonDirective],
  template: `
    <section
      class="mx-auto flex max-w-xl flex-col items-center py-12 text-center md:py-20"
      aria-labelledby="error-title">
      <span
        class="mb-6 flex size-20 items-center justify-center rounded-full bg-surface-accent text-3xl text-heading"
        aria-hidden="true">
        <i [class]="text().icon"></i>
      </span>
      <p class="mb-2 text-sm font-semibold tracking-widest text-ink-muted uppercase">{{ label() }}</p>
      <h1 id="error-title" class="mb-4 text-3xl font-semibold text-heading md:text-4xl">
        {{ title() ?? text().title }}
      </h1>
      <p class="mb-8 text-lg text-ink-muted">{{ description() ?? text().description }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a pButton routerLink="/">
          <i class="fa-solid fa-house" aria-hidden="true"></i>
          Back to home
        </a>
        <a pButton outlined routerLink="/mef">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          Search the entities
        </a>
      </div>
    </section>
  `,
})
export class Error {
  /** HTTP status code of the error, `0` without response from the server. */
  readonly status = input.required<number>();
  readonly title = input<string>();
  readonly description = input<string>();

  protected readonly text = computed(() => errorText(this.status()));
  protected readonly label = computed(() => errorLabel(this.status()));

  constructor() {
    // Server rendering: HTTP status of the response, so that the search engines don't index the page
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) {
      effect(() => {
        const status = this.status();
        if (status > 0) {
          response.status = status;
        }
      });
    }
  }
}
