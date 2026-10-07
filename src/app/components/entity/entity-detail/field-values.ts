// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

/** A value of a source field, ready to be displayed. */
export interface FieldValue {
  text: string;
  url?: string;
  /** `relation_pid`: icon and label of the redirect direction, `text` is the related pid. */
  redirect?: { class: string; label: string };
  /** VIAF identifier: link key of the MEF record, flagged as the VIAF pid of the main record. */
  linkKey?: boolean;
}

/** An object of the API (e.g. an item of `identifiedBy`). */
type ApiObject = Record<string, unknown>;

/**
 * Formatter of a known object shape: its values, or `undefined` when the object doesn't have
 * this shape (the next formatter is then tried).
 */
type ObjectFormatter = (object: ApiObject) => FieldValue[] | undefined;

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

function isObject(value: unknown): value is ApiObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
 * `identifiedBy`: identifier of the record in another system. The VIAF one is the link key.
 * e.g. `{ source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/779232' }`
 */
const identifier: ObjectFormatter = (object) => {
  if (!('value' in object)) {
    return undefined;
  }
  const [item] = fieldValues(object['value']);
  if (!item) {
    return [];
  }
  return [object['source'] === 'VIAF' ? { ...item, linkKey: true } : item];
};

/**
 * `broader`, `narrower`, `related`, `closeMatch`, `exactMatch`: linked entity, with its source and
 * a link to its first identifier which is a URL (e.g. the BNF or DNLM record).
 * e.g. `{ authorized_access_point: 'Minocycline', source: 'BNF', identifiedBy: [...] }`
 */
const linkedEntity: ObjectFormatter = (object) => {
  const name = asString(object['authorized_access_point']);
  if (name === undefined) {
    return undefined;
  }
  const source = asString(object['source']);
  const url = fieldValues(object['identifiedBy']).find((item) => item.url)?.url;
  return [{ text: source ? `${name} (${source})` : name, url }];
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
 */
export function fieldValues(value: unknown): FieldValue[] {
  if (Array.isArray(value)) {
    return value.flatMap(fieldValues);
  }
  if (isObject(value)) {
    for (const format of OBJECT_FORMATTERS) {
      const values = format(value);
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
