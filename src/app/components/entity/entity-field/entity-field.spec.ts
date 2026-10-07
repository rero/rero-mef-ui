// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { EntityField } from './entity-field';

@Component({
  imports: [EntityField],
  template: `
    <dl>
      <div appEntityField>
        <span fieldLabel>PID</span>
        <b fieldValue>22954</b>
      </div>
    </dl>
  `,
})
class TestHost {}

describe('EntityField', () => {
  it('should project the label and the value in a dt / dd pair', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const row = (fixture.nativeElement as HTMLElement).querySelector('dl > div');

    expect(row?.querySelector('dt')?.textContent).toBe('PID');
    expect(row?.querySelector('dd b')?.textContent).toBe('22954');
  });
});
