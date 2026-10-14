// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { errorLabel, errorText } from './error-text';

describe('errorText', () => {
  it('should give the texts of a known status', () => {
    expect(errorText(404).title).toBe('Not found');
    expect(errorText(404).icon).toBe('fa-solid fa-magnifying-glass');
    expect(errorText(503).title).toBe('Service unavailable');
    expect(errorText(0).title).toBe('Server unreachable');
  });

  it('should fall back on the texts of the status class', () => {
    expect(errorText(418).title).toBe('Request error');
    expect(errorText(502).title).toBe('Something went wrong');
  });
});

describe('errorLabel', () => {
  it('should give the status code, or a network error without response', () => {
    expect(errorLabel(404)).toBe('Error 404');
    expect(errorLabel(0)).toBe('Network error');
  });
});
