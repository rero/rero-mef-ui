// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

/** Application footer: MEF is a service of RERO+. */
@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly links = [
    { label: 'Source code on GitHub', url: 'https://github.com/rero/rero-mef' },
    { label: 'Contact', url: 'https://www.rero.ch/en/contact' },
  ];
}
