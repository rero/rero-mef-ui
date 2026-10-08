// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ApiService } from '@rero/ng-core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';

import { EntityField } from '../entity-field/entity-field';
import { EntityIcon } from '../entity-icon/entity-icon';
import { EntityJson } from '../entity-json/entity-json';
import { EntityRelation } from '../entity-relation/entity-relation';
import { EntitySources } from '../entity-sources/entity-sources';
import { EntityTypeLabel } from '../entity-type/entity-type';
import { ENTITY_TYPES, EntityRecord, SOURCE_LABELS } from '../entity.model';
import { entityName, sourceColor } from '../entity.utils';
import { comparisonLayout, comparisonRows, sourceFields, SourceSection } from './source-fields';

@Component({
  selector: 'app-entity-detail',
  imports: [
    EntityField,
    EntityIcon,
    EntityJson,
    EntityRelation,
    EntitySources,
    EntityTypeLabel,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    DatePipe,
    NgTemplateOutlet,
  ],
  templateUrl: './entity-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityDetail {
  private readonly apiService = inject(ApiService);

  /**
   * Record loaded by ng-core's DetailComponent. `undefined` while it is loading:
   * DetailComponent creates this component before the API response.
   */
  readonly record = input<EntityRecord>();
  /** Record type key (e.g. `agents`): bound by ng-core (`DetailRecord`), not used. */
  readonly type = input.required<string>();

  /** Name of the entity, from its first source. */
  readonly name = computed(() => {
    const record = this.record();
    return record ? entityName(record.metadata) : undefined;
  });

  readonly dataType = computed(() => {
    const record = this.record();
    return record ? ENTITY_TYPES[record.metadata.type].type : undefined;
  });

  /**
   * Absolute API URL of a record (e.g. https://mef.rero.ch/api/concepts/idref/123),
   * based on the `$refPrefix` configuration and on the entity type of the record
   * (`agents`, `concepts` or `places`), as each one has its own API index.
   * `apiBaseUrl` can't be used here as it is empty in development, where API calls go
   * through the dev server proxy.
   * @param source - `mef` or a source name (`gnd`, `idref`, `rero`).
   * @param pid - Record pid.
   */
  protected recordUrl(source: string, pid: string): string {
    return this.apiService.getRefEndpoint(`${this.dataType()}/${source}`, pid);
  }

  /** Sources of the record with their displayed fields, computed once per record. */
  protected readonly sourceSections = computed<SourceSection[]>(() => {
    const metadata = this.record()?.metadata;
    return (metadata?.sources ?? []).map((source) => {
      const data = metadata?.[source];
      return {
        source,
        label: SOURCE_LABELS[source],
        pid: data?.pid,
        fields: data ? sourceFields(data) : [],
      };
    });
  });

  /** Comparison of the sources, as first tab: only when the record has several sources. */
  protected readonly comparison = computed(() => {
    const sections = this.sourceSections();
    return sections.length > 1 ? comparisonRows(sections) : undefined;
  });

  /** Widths of the comparison table: same width for each source column. */
  protected readonly comparisonLayout = computed(() => comparisonLayout(this.sourceSections().length));

  /** Text color of a source, as its tag below the title (entity-sources). */
  protected readonly sourceColor = sourceColor;

  /** Tab panels on the card background, without padding: the fields have their own one. */
  protected readonly tabPanelsPt = {
    root: { class: 'bg-transparent p-0' },
  };
}
