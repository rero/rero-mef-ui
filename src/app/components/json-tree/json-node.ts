// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Object or array with at least one child: displayed as a collapsible node. */
export interface JsonBranch {
  kind: 'branch';
  /** Property name, or index in the parent array; none for the root. */
  key?: string;
  open: '{' | '[';
  close: '}' | ']';
  /** Number of children, displayed when the node is collapsed, e.g. `3 keys`, `1 item`. */
  size: string;
  children: JsonNode[];
}

/** Scalar value, or empty object or array. */
export interface JsonLeaf {
  kind: 'leaf';
  key?: string;
  /** Value as in JSON, e.g. `"Doe, John"` (with quotes), `12`, `null`, `[]`. */
  text: string;
  type: 'string' | 'number' | 'boolean' | 'null' | 'empty';
  /** URL of a string value which is a link, e.g. `$ref` or `identifiedBy` values (not `$schema`). */
  url?: string;
}

export type JsonNode = JsonBranch | JsonLeaf;

/** Keys whose URL values are not links: JSON schemas, identifiers rather than pages to visit. */
const UNLINKED_KEYS = new Set(['$schema']);

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function leafType(value: unknown): JsonLeaf['type'] {
  if (value === null || value === undefined) {
    return 'null';
  }
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean' ? type : 'null';
}

/** Tree of a JSON value, ready to be displayed with collapsible objects and arrays. */
export function jsonNode(value: unknown, key?: string): JsonNode {
  if (value !== null && typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries: [string, unknown][] = isArray
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value);
    if (entries.length === 0) {
      return { kind: 'leaf', key, text: isArray ? '[]' : '{}', type: 'empty' };
    }
    return {
      kind: 'branch',
      key,
      open: isArray ? '[' : '{',
      close: isArray ? ']' : '}',
      size: plural(entries.length, isArray ? 'item' : 'key'),
      children: entries.map(([childKey, child]) => jsonNode(child, childKey)),
    };
  }
  const leaf: JsonLeaf = { kind: 'leaf', key, text: JSON.stringify(value) ?? 'null', type: leafType(value) };
  const isLink = typeof value === 'string' && /^https?:\/\//.test(value) && !UNLINKED_KEYS.has(key ?? '');
  return isLink ? { ...leaf, url: value } : leaf;
}
