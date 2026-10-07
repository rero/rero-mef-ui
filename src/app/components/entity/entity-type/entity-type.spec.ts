// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { spokenText } from '../../../../testing/spoken-text';
import { EntityTypeLabel } from './entity-type';

describe('EntityTypeLabel', () => {
  let fixture: ComponentFixture<EntityTypeLabel>;

  const text = () => spokenText(fixture.nativeElement as HTMLElement);

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityTypeLabel);
  });

  it('should display the main type, then the type', async () => {
    fixture.componentRef.setInput('type', 'bf:Organisation');
    await fixture.whenStable();
    expect(text()).toBe('Agent: Organisation');
  });

  it('should not repeat the type when it is the main type', async () => {
    fixture.componentRef.setInput('type', 'bf:Place');
    await fixture.whenStable();
    expect(text()).toBe('Place');
  });

  it('should flag a deleted record, with its deletion date when asked', async () => {
    fixture.componentRef.setInput('type', 'bf:Topic');
    fixture.componentRef.setInput('deleted', '2024-02-01T12:00:00Z');
    await fixture.whenStable();
    expect(text()).toBe('Concept: Topic, Deleted');

    fixture.componentRef.setInput('showDeletedDate', true);
    await fixture.whenStable();
    expect(text()).toBe('Concept: Topic, Deleted February 1, 2024');
  });
});
