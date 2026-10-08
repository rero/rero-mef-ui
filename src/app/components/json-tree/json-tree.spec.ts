// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonTree } from './json-tree';

describe('JsonTree', () => {
  let fixture: ComponentFixture<JsonTree>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [JsonTree] }).compileComponents();
    fixture = TestBed.createComponent(JsonTree);
    fixture.componentRef.setInput('value', {
      pid: '1',
      links: { self: 'https://mef.rero.ch/api/agents/mef/1' },
      metadata: { identifiedBy: [{ source: 'VIAF' }], tags: [] },
    });
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const details = () => [...element.querySelectorAll('details')];
  const button = (label: string) =>
    [...element.querySelectorAll('button')].find((item) => item.textContent?.includes(label));

  it('should display the objects and arrays as nodes, all expanded', () => {
    expect(details().map((node) => node.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '{ …} 3 keys',
      'links: { …} 1 key',
      'metadata: { …} 2 keys',
      'identifiedBy: [ …] 1 item',
      '0: { …} 1 key',
    ]);
    expect(details().every((node) => node.open)).toBe(true);
    expect(element.textContent).toContain('source: "VIAF"');
    expect(element.textContent).toContain('tags: []');
  });

  it('should open the links in a new window', () => {
    const link = element.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://mef.rero.ch/api/agents/mef/1');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener');
    expect(link?.querySelector('.sr-only')?.textContent).toBe('(opens in a new window)');
  });

  it('should collapse and expand all the nested nodes, not the root', () => {
    button('Collapse all')?.click();
    expect(details().map((node) => node.open)).toEqual([true, false, false, false, false]);
    button('Expand all')?.click();
    expect(details().every((node) => node.open)).toBe(true);
  });

  it('should open the root collapsed by the user, to expand or collapse all', () => {
    const [root] = details();
    root.open = false;
    button('Expand all')?.click();
    expect(details().every((node) => node.open)).toBe(true);

    root.open = false;
    button('Collapse all')?.click();
    expect(details().map((node) => node.open)).toEqual([true, false, false, false, false]);
  });
});
