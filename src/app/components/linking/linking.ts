// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';

import { AuthoritySource, ENTITY_CATEGORIES, SOURCE_LABELS, SOURCE_TAG_SEVERITY } from '../entity/entity.model';

interface Source {
  label: string;
  url?: string;
  severity: Tag['severity'];
}

/** Tag of a source: official name and color, as on the home page and in the search results. */
function source(key: AuthoritySource, url?: string): Source {
  return { label: SOURCE_LABELS[key], url, severity: SOURCE_TAG_SEVERITY[key] };
}

@Component({
  selector: 'app-linking',
  imports: [NgTemplateOutlet, RouterLink, ButtonDirective, Tag],
  templateUrl: './linking.html',
  styleUrl: './linking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Linking {
  /** Source tags, linked to the source websites. */
  protected readonly sources = {
    gnd: source('gnd', 'https://www.dnb.de/EN/Professionell/Standardisierung/GND/gnd_node.html'),
    idref: source('idref', 'https://www.idref.fr/'),
    rero: source('rero'),
    viaf: source('viaf', 'https://viaf.org/'),
  };

  /** data.bnf.fr: BNF identifiers, link key of the concepts. */
  protected readonly bnfUrl = 'https://data.bnf.fr/';

  /** Sections of the page, linked from the "On this page" navigation. */
  protected readonly sections = [
    ...ENTITY_CATEGORIES.map(({ key, title, icon }) => ({ id: key, title, icon })),
    { id: 'redirects', title: 'Redirects & lifecycle', icon: 'fa-solid fa-shuffle' },
  ];
}
