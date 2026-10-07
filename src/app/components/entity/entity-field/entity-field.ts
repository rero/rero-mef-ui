// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Label / value row of the entity detail view, used on a `<div>` of a `<dl>` (the only valid
 * wrapper of a `<dt>` / `<dd>` pair): `<dl><div appEntityField>...</div></dl>`.
 *
 * Content projection:
 * - `[fieldLabel]`: field label (`<dt>`), on the left on larger screens, above the value on mobile;
 * - `[fieldValue]`: field value (`<dd>`).
 */
@Component({
  selector: 'div[appEntityField]',
  templateUrl: './entity-field.html',
  // Rows separated by a line, as the tables of the linking page
  host: {
    class: 'grid gap-x-6 gap-y-0.5 border-t border-line py-2.5 first:border-t-0 sm:grid-cols-[13rem_minmax(0,1fr)]',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityField {}
