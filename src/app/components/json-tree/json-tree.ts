// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { Button } from 'primeng/button';

import { jsonNode } from './json-node';

/**
 * JSON value with collapsible objects and arrays (native `<details>`: keyboard and screen reader
 * support), all expanded at first, with buttons to expand or collapse all the nested nodes.
 */
@Component({
  selector: 'app-json-tree',
  imports: [Button, NgTemplateOutlet],
  templateUrl: './json-tree.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonTree {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = input.required<unknown>();

  protected readonly root = computed(() => jsonNode(this.value()));

  /**
   * Expands or collapses all the nested nodes, and opens the root, which may have been collapsed by
   * the user: the tree is never hidden. The `open` state is set on the elements, as it is also
   * changed by the user (`<details>` toggled natively).
   */
  protected setAllOpen(open: boolean): void {
    const host = this.element.nativeElement;
    const root = host.querySelector('details');
    if (root) {
      root.open = true;
    }
    host.querySelectorAll('details details').forEach((details) => {
      (details as HTMLDetailsElement).open = open;
    });
  }
}
