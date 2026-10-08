// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { comparisonLayout, comparisonRows, sourceFields, SourceSection } from './source-fields';

describe('sourceFields', () => {
  it('should keep the displayed fields, in the API order', () => {
    const fields = sourceFields({
      $schema: 'https://mef.rero.ch/schemas/gnd.json',
      pid: '123',
      type: 'bf:Person',
      // As in the API: `identifier` repeated in `identifiedBy`
      identifiedBy: [
        { source: 'GND', type: 'uri', value: 'http://d-nb.info/gnd/123' },
        { source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/1' },
      ],
      identifier: 'http://d-nb.info/gnd/123',
      authorized_access_point: 'Doe, John',
      md5: 'abc',
      note: '',
    });
    expect(fields.map(({ key }) => key)).toEqual(['pid', 'type', 'identifiedBy', 'authorized_access_point']);
    expect(fields[3]).toEqual({
      key: 'authorized_access_point',
      label: 'Authorized access point',
      values: [{ text: 'Doe, John', url: undefined }],
      alert: false,
      bold: true,
      date: false,
    });
  });

  it('should display the deletion date in red and bold', () => {
    const [, deleted] = sourceFields({ pid: '1', deleted: '2024-01-01', type: 'bf:Person' });
    expect(deleted).toMatchObject({ key: 'deleted', alert: true, bold: true, date: true });
  });
});

describe('comparisonRows', () => {
  const section = (source: SourceSection['source'], data: Record<string, string>): SourceSection => ({
    source,
    label: source,
    pid: data['pid'],
    fields: sourceFields({ type: 'bf:Person', pid: '', ...data }),
  });

  it('should list the fields of all the sources, with the values of each source', () => {
    const rows = comparisonRows([
      section('gnd', { pid: '123', authorized_access_point: 'Doe, John' }),
      section('idref', { pid: '456', preferred_name: 'Doe, J.' }),
    ]);
    expect(rows.map(({ key }) => key)).toEqual(['type', 'pid', 'authorized_access_point', 'preferred_name']);
    expect(rows[2]).toMatchObject({
      label: 'Authorized access point',
      bold: true,
      cells: [
        { source: 'gnd', values: [{ text: 'Doe, John' }] },
        { source: 'idref', values: [] },
      ],
    });
    expect(rows[3].cells).toEqual([
      { source: 'gnd', values: [] },
      { source: 'idref', values: [{ text: 'Doe, J.', url: undefined }] },
    ]);
  });

  it('should have an empty cell for a source without data', () => {
    const rows = comparisonRows([section('gnd', { pid: '123' }), { source: 'rero', label: 'RERO', fields: [] }]);
    expect(rows.map(({ cells }) => cells[1])).toEqual([
      { source: 'rero', values: [] },
      { source: 'rero', values: [] },
    ]);
  });
});

describe('comparisonLayout', () => {
  it('should share the width left by the field column equally between the sources', () => {
    expect(comparisonLayout(2)).toEqual({ sourceWidth: 'calc((100% - 13rem) / 2)', minWidth: '37rem' });
    expect(comparisonLayout(3)).toEqual({ sourceWidth: 'calc((100% - 13rem) / 3)', minWidth: '49rem' });
  });
});
