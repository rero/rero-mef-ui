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
import { ENTITY_TYPES, EntityRecord, EntitySource, EntitySourceName, SOURCE_LABELS } from '../entity.model';
import { entityName } from '../entity.utils';
import { FieldValue, fieldValues, humanize } from './field-values';

/** A source field, ready to be displayed. */
interface SourceField {
  key: string;
  /** Readable label, e.g. `Authorized access point`. */
  label: string;
  values: FieldValue[];
  /** In red and bold, as the `Deleted` field of the main record. */
  alert: boolean;
  bold: boolean;
  /** Values displayed with the `longDate` format. */
  date: boolean;
}

/** A source of the record (tab of the detail view). */
interface SourceSection {
  source: EntitySourceName;
  /** Official name of the source, e.g. `IdRef`. */
  label: string;
  /** Pid of the source record, `undefined` when the source data is missing. */
  pid?: string;
  /** Displayed fields, in the API order. */
  fields: SourceField[];
}

/** Technical source fields that are not displayed. */
const HIDDEN_SOURCE_FIELDS = new Set(['$schema', 'md5']);

/** Main source fields, displayed in bold. */
const HIGHLIGHTED_SOURCE_FIELDS = new Set(['authorized_access_point']);

/** Source fields displayed in red and bold, as the `Deleted` field of the main record. */
const ALERT_SOURCE_FIELDS = new Set(['deleted']);

/** Source fields which value is a date, displayed with the `longDate` format. */
const DATE_SOURCE_FIELDS = new Set(['deleted']);

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
        fields: data ? this.sourceFields(data) : [],
      };
    });
  });

  /** Tab panels on the card background, without padding: the fields have their own one. */
  protected readonly tabPanelsPt = {
    root: { class: 'bg-transparent p-0' },
  };

  /** Displayed fields of a source record (technical and empty fields excluded), in the API order. */
  private sourceFields(data: EntitySource): SourceField[] {
    return Object.entries(data)
      .filter(([key]) => !HIDDEN_SOURCE_FIELDS.has(key))
      .map(([key, value]) => {
        const alert = ALERT_SOURCE_FIELDS.has(key);
        return {
          key,
          label: humanize(key),
          values: fieldValues(value),
          alert,
          bold: alert || HIGHLIGHTED_SOURCE_FIELDS.has(key),
          date: DATE_SOURCE_FIELDS.has(key),
        };
      })
      .filter((field) => field.values.length > 0);
  }
}
