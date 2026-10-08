// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { HomeSearch } from './home-search';

describe('HomeSearch', () => {
  let fixture: ComponentFixture<HomeSearch>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSearch],
      providers: [provideRouter([])],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HomeSearch);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const submit = async (value: string) => {
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('should have a labelled search field', () => {
    const input = element.querySelector('input');
    expect(element.querySelector(`label[for="${input?.id}"]`)?.textContent).toBe('Search MEF records');
  });

  it('should describe the search field with the hint to browse all records', () => {
    const hintId = element.querySelector('input')?.getAttribute('aria-describedby');
    expect(element.querySelector(`#${hintId}`)?.textContent?.trim()).toBe(
      'Leave the field empty and click "Search" to browse all records.',
    );
  });

  it('should open the MEF search with the trimmed query', async () => {
    await submit('  Goethe ');
    expect(navigate).toHaveBeenLastCalledWith(['/mef'], { queryParams: { q: 'Goethe' } });
  });

  it('should open the MEF search without query when the field is empty', async () => {
    await submit('   ');
    expect(navigate).toHaveBeenLastCalledWith(['/mef'], { queryParams: {} });
  });
});
