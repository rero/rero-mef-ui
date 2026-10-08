// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EntitySource, EntitySourceName } from '../entity.model';
import { FieldValue, fieldValues, humanize } from './field-values';

/** Display options of a source field, which depend only on its key. */
interface FieldDisplay {
  key: string;
  /** Readable label, e.g. `Authorized access point`. */
  label: string;
  /** In red and bold, as the `Deleted` field of the main record. */
  alert: boolean;
  bold: boolean;
  /** Values displayed with the `longDate` format. */
  date: boolean;
}

/** A source field, ready to be displayed. */
export interface SourceField extends FieldDisplay {
  values: FieldValue[];
}

/** A source of the record (tab of the detail view). */
export interface SourceSection {
  source: EntitySourceName;
  /** Official name of the source, e.g. `IdRef`. */
  label: string;
  /** Pid of the source record, `undefined` when the source data is missing. */
  pid?: string;
  /** Displayed fields, in the API order. */
  fields: SourceField[];
}

/** A row of the comparison of the sources: a field, with its values in each source. */
export interface ComparisonRow extends FieldDisplay {
  /** One cell per source, in the order of the sources; no values when the source lacks the field. */
  cells: { source: EntitySourceName; values: FieldValue[] }[];
}

/**
 * Source fields that are not displayed: technical ones, and `identifier`, whose URL is always
 * repeated in `identifiedBy` (displayed).
 */
const HIDDEN_SOURCE_FIELDS = new Set(['$schema', 'md5', 'identifier']);

/** Main source fields, displayed in bold. */
const HIGHLIGHTED_SOURCE_FIELDS = new Set(['authorized_access_point']);

/** Source fields displayed in red and bold, as the `Deleted` field of the main record. */
const ALERT_SOURCE_FIELDS = new Set(['deleted']);

/** Source fields which value is a date, displayed with the `longDate` format. */
const DATE_SOURCE_FIELDS = new Set(['deleted']);

function fieldDisplay(key: string): FieldDisplay {
  const alert = ALERT_SOURCE_FIELDS.has(key);
  return {
    key,
    label: humanize(key),
    alert,
    bold: alert || HIGHLIGHTED_SOURCE_FIELDS.has(key),
    date: DATE_SOURCE_FIELDS.has(key),
  };
}

/** Displayed fields of a source record (technical and empty fields excluded), in the API order. */
export function sourceFields(data: EntitySource): SourceField[] {
  return Object.entries(data)
    .filter(([key]) => !HIDDEN_SOURCE_FIELDS.has(key))
    .map(([key, value]) => ({ ...fieldDisplay(key), values: fieldValues(value) }))
    .filter((field) => field.values.length > 0);
}

/**
 * Comparison of the sources: one row per field present in at least one source, in the order of
 * their first appearance (first source first), with the values of each source.
 */
export function comparisonRows(sections: SourceSection[]): ComparisonRow[] {
  const keys = new Set(sections.flatMap(({ fields }) => fields.map(({ key }) => key)));
  return [...keys].map((key) => ({
    ...fieldDisplay(key),
    cells: sections.map(({ source, fields }) => ({
      source,
      values: fields.find((field) => field.key === key)?.values ?? [],
    })),
  }));
}

/** Width of the field column of the comparison (`w-52`), in rem. */
const COMPARISON_FIELD_WIDTH = 13;

/** Minimum width of a source column of the comparison, in rem: below, the table scrolls. */
const COMPARISON_SOURCE_MIN_WIDTH = 12;

/**
 * Layout of the comparison table (fixed layout): the source columns share equally the width left
 * by the field column, and the table has a minimum width so that they stay readable on mobile.
 */
export function comparisonLayout(sourceCount: number): { sourceWidth: string; minWidth: string } {
  return {
    sourceWidth: `calc((100% - ${COMPARISON_FIELD_WIDTH}rem) / ${sourceCount})`,
    minWidth: `${COMPARISON_FIELD_WIDTH + sourceCount * COMPARISON_SOURCE_MIN_WIDTH}rem`,
  };
}
