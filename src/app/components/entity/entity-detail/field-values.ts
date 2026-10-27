// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ApiObject } from '../entity.model';
import { apiObjects, isObject } from '../entity.utils';

/** A value of a source field, ready to be displayed. */
export interface FieldValue {
  text: string;
  url?: string;
  /** `relation_pid`: icon and label of the redirect direction, `text` is the related pid. */
  redirect?: { class: string; label: string };
  /** Value carrying the link key of the source (VIAF cluster, GND PID or BNF identifier, see `recordLinking`). */
  linkKey?: boolean;
  /** Source of a linked entity or of an identifier, displayed in parentheses, e.g. `FRBNF16778187 (BNF)`. */
  source?: string;
  /** `closeMatch`, `exactMatch`: identifiers of the linked entity other than its link (e.g. its BNF number). */
  identifiers?: FieldValue[];
}

/**
 * Formatter of a known object shape: its values, or `undefined` when the object doesn't have
 * this shape (the next formatter is then tried).
 */
type ObjectFormatter = (object: ApiObject, linkKeys: readonly unknown[]) => FieldValue[] | undefined;

/** Icons of the `relation_pid` types: GND `redirect_to` and IdRef `redirect_from`. */
const RELATION_ICONS: Record<string, FieldValue['redirect']> = {
  redirect_to: { class: 'fa-solid fa-circle-right', label: 'Redirect to' },
  redirect_from: { class: 'fa-solid fa-circle-left', label: 'Redirect from' },
};

/** Readable label from a key, e.g. `authorized_access_point` or `closeMatch` -> `Close match`. */
export function humanize(key: string): string {
  const label = key
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isUrl(text: string): boolean {
  return /^https?:\/\//.test(text);
}

/** The value if it is a string, otherwise `undefined`. */
function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * `relation_pid`: pid of the related record in the same source, with the redirect direction.
 * e.g. `{ type: 'redirect_to', value: '4005728-8' }`
 */
const relationPid: ObjectFormatter = (object) => {
  const redirect = RELATION_ICONS[asString(object['type']) ?? ''];
  const pid = object['value'];
  if (!redirect || pid == null || pid === '') {
    return undefined;
  }
  return [{ text: String(pid), redirect }];
};

/**
 * `identifiedBy`: identifier of the record in another system, with its source, e.g.
 * `FRBNF17049343 (BNF)`.
 * e.g. `{ source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/779232' }`
 */
const identifier: ObjectFormatter = (object) => {
  if (!('value' in object)) {
    return undefined;
  }
  const source = asString(object['source']);
  return fieldValues(object['value'])
    .slice(0, 1)
    .map((value) => ({ ...value, source }));
};

/**
 * `broader`, `narrower`, `related`, `closeMatch`, `exactMatch`: linked entity, with its source, a
 * link to its first identifier which is a URL (e.g. the BNF or DNLM record) and its other
 * identifiers (e.g. the BNF number and the GND PID), the ones carrying the link key flagged.
 * e.g. `{ authorized_access_point: 'Minocycline', source: 'BNF', identifiedBy: [...] }`
 */
const linkedEntity: ObjectFormatter = (object, linkKeys) => {
  const name = asString(object['authorized_access_point']);
  if (name === undefined) {
    return undefined;
  }
  const values = fieldValues(apiObjects(object['identifiedBy']), linkKeys);
  // The identifier linked from the name is not repeated: its link key (e.g. a BNF ark) goes to the name
  const link = values.find((item) => item.url);
  const identifiers = values.filter((item) => item !== link);
  return [
    {
      text: name,
      url: link?.url,
      source: asString(object['source']),
      linkKey: link?.linkKey,
      identifiers: identifiers.length ? identifiers : undefined,
    },
  ];
};

/**
 * `classification`: code, with its name.
 * e.g. `{ classificationPortion: '944', name: 'Histoire de la France', type: 'bf:ClassificationDdc' }`
 */
const classification: ObjectFormatter = (object) => {
  if (!('classificationPortion' in object)) {
    return undefined;
  }
  const code = String(object['classificationPortion']);
  const name = asString(object['name']);
  return [{ text: name ? `${code} – ${name}` : code }];
};

/**
 * `note`: one value per label, prefixed with the readable note type.
 * e.g. `{ label: ['Brockhaus, 19. Aufl.'], noteType: 'dataSource' }` -> `Data source: Brockhaus…`
 */
const note: ObjectFormatter = (object) => {
  if (!('label' in object)) {
    return undefined;
  }
  const noteType = asString(object['noteType']);
  const prefix = noteType ? `${humanize(noteType)}: ` : '';
  return fieldValues(object['label']).map((item) => ({ ...item, text: prefix + item.text }));
};

/**
 * Link to another record of the API (RERO concepts `broader`, `narrower`, `related`).
 * e.g. `{ $ref: 'https://mef.rero.ch/api/concepts/rero/A1' }`
 */
const apiLink: ObjectFormatter = (object) => {
  const ref = asString(object['$ref']);
  return ref === undefined ? undefined : [{ text: ref, url: ref }];
};

/** Known object shapes, in order: the first formatter which recognizes the object is used. */
const OBJECT_FORMATTERS: ObjectFormatter[] = [relationPid, identifier, linkedEntity, classification, note, apiLink];

/**
 * Values of a source field, ready to be displayed, whatever its shape: text, number, list or
 * object. Objects of an unknown shape are displayed as JSON.
 * @param linkKeys - Items of the field (as in the API) carrying the link key, flagged: the items
 * themselves, not their text, as other items may be displayed the same way. Also searched in the
 * identifiers of the matches.
 */
export function fieldValues(value: unknown, linkKeys: readonly unknown[] = []): FieldValue[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => fieldValues(item, linkKeys));
  }
  if (linkKeys.includes(value)) {
    return fieldValues(value).map((item) => ({ ...item, linkKey: true }));
  }
  if (isObject(value)) {
    for (const format of OBJECT_FORMATTERS) {
      const values = format(value, linkKeys);
      if (values) {
        return values;
      }
    }
    return [{ text: JSON.stringify(value) }];
  }
  if (value === null || value === undefined || value === '') {
    return [];
  }
  const text = String(value);
  return [{ text, url: isUrl(text) ? text : undefined }];
}
