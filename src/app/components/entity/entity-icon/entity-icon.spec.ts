// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityIcon } from './entity-icon';

describe('EntityIcon', () => {
  let fixture: ComponentFixture<EntityIcon>;
  const badge = () => (fixture.nativeElement as HTMLElement).querySelector('span');

  beforeEach(async () => {
    fixture = TestBed.createComponent(EntityIcon);
    fixture.componentRef.setInput('type', 'bf:Organisation');
    await fixture.whenStable();
  });

  it('should display the icon of the type, with the type as tooltip', () => {
    expect([...(badge()?.querySelector('i')?.classList ?? [])].sort()).toEqual(['fa-building', 'fa-solid']);
    expect(badge()?.getAttribute('title')).toBe('Agent: Organisation');
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });

  it('should display a deleted record in red, in the requested size', async () => {
    fixture.componentRef.setInput('deleted', true);
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();
    expect(badge()?.classList).toContain('text-danger');
    expect(badge()?.classList).toContain('size-12');
  });

  it('should display the icon of a main entity type, with its title as tooltip', async () => {
    fixture.componentRef.setInput('type', undefined);
    fixture.componentRef.setInput('category', 'places');
    await fixture.whenStable();
    expect(badge()?.querySelector('i')?.classList).toContain('fa-location-pin');
    expect(badge()?.getAttribute('title')).toBe('Places');
  });
});
