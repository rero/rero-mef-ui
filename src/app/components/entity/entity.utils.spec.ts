// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EntityMetadata } from './entity.model';
import { entityDetailLink, entityName, entityTypeLabel } from './entity.utils';

describe('entity utils', () => {
  it('entityTypeLabel: should give the main type and the type, not repeated', () => {
    expect(entityTypeLabel('bf:Person')).toBe('Agent: Person');
    expect(entityTypeLabel('bf:Temporal')).toBe('Concept: Temporal');
    expect(entityTypeLabel('bf:Place')).toBe('Place');
  });

  it('entityDetailLink: should link to the detail view of the entity type index', () => {
    expect(entityDetailLink({ type: 'bf:Organisation', pid: '1' })).toBe('/agents/detail/1');
    expect(entityDetailLink({ type: 'bf:Topic', pid: '2' })).toBe('/concepts/detail/2');
    expect(entityDetailLink({ type: 'bf:Place', pid: '3' })).toBe('/places/detail/3');
  });

  it('entityName: should give the first authorized access point of the sources', () => {
    const metadata: EntityMetadata = {
      pid: '1',
      type: 'bf:Person',
      sources: ['idref', 'gnd'],
      idref: { pid: '10', type: 'bf:Person' },
      gnd: { pid: '20', type: 'bf:Person', authorized_access_point: 'Doe, John' },
    };
    expect(entityName(metadata)).toBe('Doe, John');
    expect(entityName({ ...metadata, sources: [] })).toBeUndefined();
  });
});
