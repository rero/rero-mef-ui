// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ApiService } from '@rero/ng-core';

import { version } from '../../../../package.json';

/** Response of the `version` endpoint of the MEF API. */
interface ApiVersion {
  version: string;
}

/** Version of a RERO repository, linked to its GitHub release (tags `v1.2.3`). */
export function release(repository: string, version: string): { label: string; url: string } {
  return { label: `${repository} v${version}`, url: `https://github.com/rero/${repository}/releases/tag/v${version}` };
}

/** Application footer: MEF is a service of RERO+, with the running versions of the UI and of the backend. */
@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly endpoint = inject(ApiService).getEndpointByType('version', true);

  protected readonly links = [
    { label: 'Source code on GitHub', url: 'https://github.com/rero/rero-mef' },
    { label: 'Contact', url: 'https://www.rero.ch/en/contact' },
  ];

  /** Version of the backend, from the MEF API. */
  private readonly apiVersion = httpResource<ApiVersion>(() => this.endpoint);

  /** Version of the application (`package.json`, set at the release), then of the backend. */
  protected readonly releases = computed(() => [
    release('rero-mef-ui', version),
    ...(this.apiVersion.hasValue() ? [release('rero-mef', this.apiVersion.value().version)] : []),
  ]);
}
