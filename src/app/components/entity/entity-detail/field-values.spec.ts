// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { humanize, fieldValues as values } from './field-values';

describe('fieldValues', () => {
  it('should display a classification', () => {
    expect(
      values({
        classificationPortion: '944',
        name: 'Histoire de la France (depuis 486)',
        type: 'bf:ClassificationDdc',
      }),
    ).toEqual([{ text: '944 – Histoire de la France (depuis 486)' }]);
    expect(values({ classificationPortion: '305', type: 'bf:ClassificationDdc' })).toEqual([{ text: '305' }]);
  });

  it('should display a broader concept', () => {
    expect(values({ authorized_access_point: 'Histoire religieuse - Allemagne - 18e siècle' })).toEqual([
      { text: 'Histoire religieuse - Allemagne - 18e siècle', url: undefined },
    ]);
  });

  it('should display a match with its source and identifier link', () => {
    expect(
      values({
        authorized_access_point: 'Minocycline',
        source: 'BNF',
        identifiedBy: [{ source: 'BNF', type: 'uri', value: 'https://data.bnf.fr/1' }],
      }),
    ).toEqual([{ text: 'Minocycline (BNF)', url: 'https://data.bnf.fr/1' }]);
  });

  it('should display one line per note label', () => {
    expect(
      values({
        label: [
          'Brockhaus, 19. Aufl. (art. Isenburg)',
          'Isenburg-Büdingen <Grafschaft> / Toleranzedikt ; SWD, 1995-04',
        ],
        noteType: 'dataSource',
      }),
    ).toEqual([
      { text: 'Data source: Brockhaus, 19. Aufl. (art. Isenburg)', url: undefined },
      {
        text: 'Data source: Isenburg-Büdingen <Grafschaft> / Toleranzedikt ; SWD, 1995-04',
        url: undefined,
      },
    ]);
  });

  it('should display a link to another record', () => {
    expect(values({ $ref: 'https://mef.rero.ch/api/concepts/rero/A1' })).toEqual([
      {
        text: 'https://mef.rero.ch/api/concepts/rero/A1',
        url: 'https://mef.rero.ch/api/concepts/rero/A1',
      },
    ]);
  });

  it('should display a relation pid with its redirect direction', () => {
    expect(values({ type: 'redirect_to', value: '4005728-8' })).toEqual([
      {
        text: '4005728-8',
        redirect: { class: 'fa-solid fa-circle-right', label: 'Redirect to' },
      },
    ]);
    expect(values([{ type: 'redirect_from', value: '027237850' }])).toEqual([
      {
        text: '027237850',
        redirect: { class: 'fa-solid fa-circle-left', label: 'Redirect from' },
      },
    ]);
  });

  it('should flag the VIAF identifier as link key', () => {
    expect(
      values([
        { source: 'VIAF', type: 'uri', value: 'http://viaf.org/viaf/779232' },
        { source: 'IDREF', type: 'uri', value: 'http://www.idref.fr/165795182' },
      ]),
    ).toEqual([
      { text: 'http://viaf.org/viaf/779232', url: 'http://viaf.org/viaf/779232', linkKey: true },
      { text: 'http://www.idref.fr/165795182', url: 'http://www.idref.fr/165795182' },
    ]);
  });

  it('should display an identifier as a link', () => {
    expect(values([{ source: 'IDREF', type: 'uri', value: 'http://www.idref.fr/027237850' }])).toEqual([
      { text: 'http://www.idref.fr/027237850', url: 'http://www.idref.fr/027237850' },
    ]);
  });

  it('should display texts, numbers and URLs, and skip the empty values', () => {
    expect(values(['A', 12, null, '', 'https://viaf.org/'])).toEqual([
      { text: 'A', url: undefined },
      { text: '12', url: undefined },
      { text: 'https://viaf.org/', url: 'https://viaf.org/' },
    ]);
  });

  it('should display an unknown object as JSON', () => {
    expect(values({ foo: 'bar' })).toEqual([{ text: '{"foo":"bar"}' }]);
  });
});

describe('humanize', () => {
  it('should give a readable label from an API key', () => {
    expect(humanize('authorized_access_point')).toBe('Authorized access point');
    expect(humanize('closeMatch')).toBe('Close match');
  });
});
