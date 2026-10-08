// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { jsonNode } from './json-node';

describe('jsonNode', () => {
  it('should display the scalar values as in JSON', () => {
    expect(jsonNode('Doe, John', 'name')).toEqual({ kind: 'leaf', key: 'name', text: '"Doe, John"', type: 'string' });
    expect(jsonNode(12)).toEqual({ kind: 'leaf', key: undefined, text: '12', type: 'number' });
    expect(jsonNode(false)).toMatchObject({ text: 'false', type: 'boolean' });
    expect(jsonNode(null)).toMatchObject({ text: 'null', type: 'null' });
  });

  it('should give the URL of the links', () => {
    expect(jsonNode('https://mef.rero.ch/api/agents/gnd/1', '$ref')).toEqual({
      kind: 'leaf',
      key: '$ref',
      text: '"https://mef.rero.ch/api/agents/gnd/1"',
      type: 'string',
      url: 'https://mef.rero.ch/api/agents/gnd/1',
    });
    expect(jsonNode('http://viaf.org/viaf/1')).toMatchObject({ url: 'http://viaf.org/viaf/1' });
    expect(jsonNode('mailto:info@rero.ch')).not.toHaveProperty('url');
    expect(jsonNode('https://mef.rero.ch/schemas/mef/mef-v0.0.1.json', '$schema')).not.toHaveProperty('url');
  });

  it('should not make the empty objects and arrays collapsible', () => {
    expect(jsonNode({}, 'a')).toEqual({ kind: 'leaf', key: 'a', text: '{}', type: 'empty' });
    expect(jsonNode([], 'b')).toEqual({ kind: 'leaf', key: 'b', text: '[]', type: 'empty' });
  });

  it('should make the objects collapsible, with their number of keys', () => {
    expect(jsonNode({ pid: '1', deleted: null })).toEqual({
      kind: 'branch',
      key: undefined,
      open: '{',
      close: '}',
      size: '2 keys',
      children: [
        { kind: 'leaf', key: 'pid', text: '"1"', type: 'string' },
        { kind: 'leaf', key: 'deleted', text: 'null', type: 'null' },
      ],
    });
  });

  it('should make the arrays collapsible, with their indexes as keys', () => {
    const node = jsonNode([{ source: 'VIAF' }], 'identifiedBy');
    expect(node).toMatchObject({ kind: 'branch', key: 'identifiedBy', open: '[', close: ']', size: '1 item' });
    expect(node.kind === 'branch' && node.children[0]).toMatchObject({ kind: 'branch', key: '0', size: '1 key' });
  });
});
