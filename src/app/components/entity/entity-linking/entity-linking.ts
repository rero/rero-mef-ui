// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Tag } from '@openng/optimus-ui/tag';

import { SOURCE_LABELS, SOURCE_TAG_SEVERITY } from '../entity.model';
import { carrierSearch, contestedLinking, LinkStatus, RecordLinking, SourceLink } from '../record-linking';
import { KeyCarriersService } from './key-carriers.service';

/**
 * Icon, label and text color of the link statuses: not only a color, for the accessibility. The
 * `alert` ones (a problem in the source records) are displayed in red.
 */
const STATUS_DISPLAY: Record<LinkStatus, { icon: string; label: string; class: string; alert?: boolean }> = {
  linked: { icon: 'fa-solid fa-circle-check', label: 'Linked', class: 'text-green-700 dark:text-green-400' },
  unshared: { icon: 'fa-solid fa-link-slash', label: 'Not shared', class: 'text-ink-muted' },
  mismatch: {
    icon: 'fa-solid fa-triangle-exclamation',
    label: 'Different key',
    class: 'text-danger-strong',
    alert: true,
  },
  ambiguous: {
    icon: 'fa-solid fa-triangle-exclamation',
    label: 'Several keys',
    class: 'text-danger-strong',
    alert: true,
  },
  contested: {
    icon: 'fa-solid fa-triangle-exclamation',
    label: 'Several records',
    class: 'text-danger-strong',
    alert: true,
  },
  missing: { icon: 'fa-solid fa-circle-minus', label: 'No link key', class: 'text-ink-muted' },
  excluded: { icon: 'fa-solid fa-ban', label: 'Not cross-linked', class: 'text-ink-muted' },
};

/**
 * Sources having a status, as the subject of a sentence: their names (e.g. `GND and IdRef`) and
 * whether the verb is plural; `undefined` when no source has it.
 */
function sourcesWith(sources: SourceLink[], status: LinkStatus): { names: string; plural: boolean } | undefined {
  const names = sources.filter((link) => link.status === status).map(({ source }) => SOURCE_LABELS[source]);
  return names.length ? { names: names.join(' and '), plural: names.length > 1 } : undefined;
}

/** An arrow of the diagram, with an optional label, in red when the link is broken. */
export interface DiagramArrow {
  label?: string;
  broken?: boolean;
}

/** Arrows of the diagram: from the sources to the VIAF hub (agents only), and to the MEF record. */
export function diagramArrows({ category, hub, key, carriers }: RecordLinking): {
  hub?: DiagramArrow;
  mef: DiagramArrow;
} {
  if (category === 'agents') {
    return { hub: {}, mef: { label: 'viaf_pid', broken: !hub } };
  }
  return { mef: carriers ? { label: 'several records', broken: true } : { label: key ? 'same key' : undefined } };
}

/** Readable summary of the linking of a record, which repeats the diagram for the screen readers. */
export function linkingSummary({ category, method, hub, key, sources, carriers, conflict }: RecordLinking): string {
  if (category === 'agents') {
    if (!hub) {
      return 'No VIAF cluster: the sources are not linked by VIAF.';
    }
    const mismatch = sourcesWith(sources, 'mismatch');
    return mismatch
      ? `The sources are linked by their VIAF cluster ${hub}, but ${mismatch.names} ${mismatch.plural ? 'state other VIAF clusters' : 'states another VIAF cluster'}.`
      : `The sources are linked by their VIAF cluster ${hub}.`;
  }
  if (key) {
    const linked = sources.filter(({ status }) => status === 'linked');
    return `The ${linked.length} sources share the same ${method}: ${key}.`;
  }
  const ambiguous = sourcesWith(sources, 'ambiguous');
  if (ambiguous) {
    const { names, plural } = ambiguous;
    return `${names} ${plural ? 'state' : 'states'} several different ${method}s: MEF does not link ${plural ? 'them' : 'it'}.`;
  }
  const contested = sources.find(({ status }) => status === 'contested');
  if (contested && carriers) {
    const others = carriers.filter(({ current }) => !current).length;
    const carried = (contested.keys?.length ?? 0) > 1 ? `one of its ${method}s` : `the same ${method}`;
    // GND states the strength of its matches: MEF links the single exact match among them
    const hint = category === 'concepts' && conflict === 'gnd' ? ' Only a single GND exactMatch would decide.' : '';
    return `${others} other ${others > 1 ? 'records carry' : 'record carries'} ${carried}: MEF links none of them.${hint}`;
  }
  const unshared = sources.find(({ status }) => status === 'unshared');
  if (unshared) {
    return `Only ${SOURCE_LABELS[unshared.source]} carries a ${method}: ${unshared.value}.`;
  }
  return sources.some(({ status }) => status === 'mismatch')
    ? `The sources carry different ${method}s: check the source records.`
    : `No source carries a ${method}.`;
}

/**
 * Linking of a MEF record, as the diagrams of the linking page: the sources, with the link key
 * they carry and its status, then the VIAF hub (agents) and the MEF record.
 */
@Component({
  selector: 'app-entity-linking',
  imports: [NgTemplateOutlet, RouterLink, Tag],
  templateUrl: './entity-linking.html',
  host: { class: 'block' },
})
export class EntityLinking {
  private readonly keyCarriers = inject(KeyCarriersService);

  readonly linking = input.required<RecordLinking>();
  /** Pid of the MEF record. */
  readonly pid = input.required<string>();

  /** Search of the records carrying the link keys of a source not linked, only in this case. */
  private readonly search = computed(() => carrierSearch(this.linking()));

  /** Records carrying the link keys of the source not linked. */
  protected readonly carriers = rxResource({
    params: () => this.search(),
    stream: ({ params }) => this.keyCarriers.carriers(params),
  });

  /** Linking, `contested` when other records carry the link keys; as is while they are searched. */
  protected readonly display = computed(() => {
    const linking = this.linking();
    const search = this.search();
    const carriers = this.carriers.hasValue() ? this.carriers.value() : [];
    return search && carriers.length ? contestedLinking(linking, search, carriers, this.pid()) : linking;
  });

  /** The source not linked carries several keys: the keys of each carrier are displayed. */
  protected readonly severalKeys = computed(() => (this.search()?.keys.length ?? 0) > 1);

  protected readonly summary = computed(() => linkingSummary(this.display()));
  protected readonly arrows = computed(() => diagramArrows(this.display()));

  protected readonly labels = SOURCE_LABELS;
  protected readonly severity = SOURCE_TAG_SEVERITY;
  protected readonly statuses = STATUS_DISPLAY;
}
