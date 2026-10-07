// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TestBed } from '@angular/core/testing';

import { EntitySources } from './entity-sources';

describe('EntitySources', () => {
  it('should display one tag per source, in a labelled list', async () => {
    const fixture = TestBed.createComponent(EntitySources);
    fixture.componentRef.setInput('sources', ['idref', 'gnd', 'rero']);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ul')?.getAttribute('aria-label')).toBe('Sources');
    const tags = [...element.querySelectorAll('li p-tag')];
    expect(tags.map((tag) => tag.textContent?.trim())).toEqual(['IdRef', 'GND', 'RERO']);
    // GND: `info` severity, RERO: `secondary` (see SOURCE_TAG_SEVERITY)
    expect(tags[1].classList).toContain('p-tag-info');
    expect(tags[2].classList).toContain('p-tag-secondary');
  });
});
