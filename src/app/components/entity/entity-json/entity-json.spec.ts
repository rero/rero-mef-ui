// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordService } from '@rero/ng-core';
import { of } from 'rxjs';

import { EntityJson } from './entity-json';

describe('EntityJson', () => {
  let fixture: ComponentFixture<EntityJson>;
  const getRecord = vi.fn(() => of({ id: '117023450', metadata: { pid: '117023450' } }));

  beforeEach(async () => {
    getRecord.mockClear();
    await TestBed.configureTestingModule({
      imports: [EntityJson],
      providers: [{ provide: RecordService, useValue: { getRecord } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityJson);
    fixture.componentRef.setInput('index', 'agents/gnd');
    fixture.componentRef.setInput('pid', '117023450');
    fixture.componentRef.setInput('label', 'gnd');
    await fixture.whenStable();
  });

  it('should not load the record before the dialog is opened', () => {
    expect(getRecord).not.toHaveBeenCalled();
  });

  it('should load the record from its API index once, when the dialog is opened', async () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();
    await fixture.whenStable();
    button?.click();
    await fixture.whenStable();

    expect(getRecord).toHaveBeenCalledTimes(1);
    expect(getRecord).toHaveBeenCalledWith('agents/gnd', '117023450', { resolve: 1 });
    expect(document.body.querySelector('pre')?.textContent).toContain('"pid": "117023450"');
  });
});
