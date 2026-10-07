// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Test helper: text read by screen readers, without the decorative (`aria-hidden`) elements. */
export function spokenText(element: Element | null | undefined): string | undefined {
  if (!element) {
    return undefined;
  }
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
  return clone.textContent?.replace(/\s+/g, ' ').trim();
}
