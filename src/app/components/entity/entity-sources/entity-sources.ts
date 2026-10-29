// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, input } from '@angular/core';
import { Tag } from '@openng/optimus-ui/tag';

import { AuthoritySource, SOURCE_LABELS, SOURCE_TAG_SEVERITY } from '../entity.model';

/** Sources (e.g. `gnd`, `idref`, `viaf`), as tags with their official name, in their colors. */
@Component({
  selector: 'app-entity-sources',
  imports: [Tag],
  templateUrl: './entity-sources.html',
  host: { class: 'block' },
})
export class EntitySources {
  readonly sources = input.required<readonly AuthoritySource[]>();

  protected readonly labels = SOURCE_LABELS;
  protected readonly severity = SOURCE_TAG_SEVERITY;
}
