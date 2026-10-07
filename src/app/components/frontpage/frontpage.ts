// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { RecordService } from '@rero/ng-core';
import { ButtonDirective } from 'primeng/button';
import { map } from 'rxjs';

import { EntityIcon } from '../entity/entity-icon/entity-icon';
import { EntitySources } from '../entity/entity-sources/entity-sources';
import { AuthoritySource, ENTITY_CATEGORIES, EntityCategory } from '../entity/entity.model';

/** Search response of `all/mef`, reduced to the `entity` aggregation. */
interface EntityAggregationResult {
  aggregations: { entity?: { buckets: { key: string; doc_count: number }[] } };
}

@Component({
  selector: 'app-frontpage',
  imports: [DecimalPipe, NgOptimizedImage, RouterLink, ButtonDirective, EntityIcon, EntitySources],
  templateUrl: './frontpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Frontpage {
  private readonly recordService = inject(RecordService);

  /** Descriptions of the entity type cards. */
  private readonly descriptions: Record<EntityCategory, string> = {
    agents: 'Persons and organisations linked across VIAF, IdRef, GND, and RERO.',
    concepts: 'Subject headings and thematic terms aligned across sources.',
    places: 'Geographic entities with cross-source identifiers.',
  };

  protected readonly entities = ENTITY_CATEGORIES.map((category) => ({
    ...category,
    description: this.descriptions[category.key],
    apiUrl: `/api/${category.key}/mef/`,
  }));

  /** Number of MEF records by entity type, from the `entity` aggregation of the `all/mef` index. */
  protected readonly counts = rxResource({
    stream: () =>
      this.recordService
        .getRecords<EntityAggregationResult>('all/mef', { itemsPerPage: 1, facets: ['entity'] })
        .pipe(
          map((result) =>
            Object.fromEntries(
              (result.aggregations.entity?.buckets ?? []).map((bucket) => [bucket.key, bucket.doc_count]),
            ),
          ),
        ),
  });

  protected readonly steps = [
    {
      icon: 'fa-solid fa-cloud-arrow-down',
      title: 'Harvest',
      description: 'Authority records are harvested automatically from each source.',
    },
    {
      icon: 'fa-solid fa-link',
      title: 'Align',
      description: 'Records describing the same entity are aligned into a single MEF record.',
    },
    {
      icon: 'fa-solid fa-fingerprint',
      title: 'Identify',
      description: 'Each entity gets a stable MEF identifier, kept in sync with its sources.',
    },
  ];

  /** Sources of MEF, displayed in "How MEF works". */
  protected readonly sources: readonly AuthoritySource[] = ['viaf', 'idref', 'gnd', 'rero'];

  protected readonly products = [
    {
      name: 'RERO ILS',
      description: 'Integrated library system for libraries and library networks.',
      url: 'https://bib.rero.ch',
      domain: 'bib.rero.ch',
      logo: 'images/logo_rero_ils.svg',
      width: 65,
      height: 44,
    },
    {
      name: 'RERO SONAR',
      description: 'Swiss open access repository for academic publications and research data.',
      url: 'https://sonar.rero.ch',
      domain: 'sonar.rero.ch',
      logo: 'images/logo_sonar.svg',
      width: 123,
      height: 36,
    },
  ];
}
