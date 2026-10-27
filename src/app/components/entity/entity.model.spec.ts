// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { isEntityCategory, isEntityType } from './entity.model';

describe('entity model', () => {
  it('isEntityCategory: should accept only the main entity types', () => {
    expect(isEntityCategory('agents')).toBe(true);
    expect(isEntityCategory('concepts')).toBe(true);
    expect(isEntityCategory('places')).toBe(true);
    expect(isEntityCategory('mef')).toBe(false);
    expect(isEntityCategory('bf:Person')).toBe(false);
  });

  it('isEntityType: should accept only the known entity types, not the inherited keys', () => {
    expect(isEntityType('bf:Person')).toBe(true);
    expect(isEntityType('bf:Work')).toBe(false);
    expect(isEntityType('constructor')).toBe(false);
    expect(isEntityType('toString')).toBe(false);
  });
});
