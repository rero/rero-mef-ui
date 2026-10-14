// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Texts and icon displayed for an error. */
export interface ErrorText {
  title: string;
  description: string;
  icon: string;
}

const WARNING_ICON = 'fa-solid fa-triangle-exclamation';
const SEARCH_ICON = 'fa-solid fa-magnifying-glass';
const LOCK_ICON = 'fa-solid fa-lock';

/** Texts of the HTTP statuses that the API or the application may return. */
const ERROR_TEXTS: Record<number, ErrorText> = {
  // Status `0`: no response, the request did not reach the server
  0: {
    title: 'Server unreachable',
    description: 'The MEF server could not be reached. Check your connection and try again.',
    icon: 'fa-solid fa-plug-circle-xmark',
  },
  400: {
    title: 'Bad request',
    description: 'The request is not valid. Check the link and try again.',
    icon: WARNING_ICON,
  },
  401: {
    title: 'Access denied',
    description: 'You are not allowed to access this resource.',
    icon: LOCK_ICON,
  },
  403: {
    title: 'Access denied',
    description: 'You are not allowed to access this resource.',
    icon: LOCK_ICON,
  },
  404: {
    title: 'Not found',
    description: 'The page or entity you are looking for does not exist or has been moved.',
    icon: SEARCH_ICON,
  },
  410: {
    title: 'No longer available',
    description: 'This resource has been removed.',
    icon: SEARCH_ICON,
  },
  429: {
    title: 'Too many requests',
    description: 'Too many requests have been sent. Please wait a moment and try again.',
    icon: 'fa-solid fa-hourglass-half',
  },
  503: {
    title: 'Service unavailable',
    description: 'The service is temporarily unavailable, for example during maintenance. Please try again later.',
    icon: 'fa-solid fa-screwdriver-wrench',
  },
};

/** Texts of the statuses without their own ones, by class (`4xx`, `5xx`). */
const CLIENT_ERROR_TEXT: ErrorText = {
  title: 'Request error',
  description: 'The request could not be processed. Check the link and try again.',
  icon: WARNING_ICON,
};
const SERVER_ERROR_TEXT: ErrorText = {
  title: 'Something went wrong',
  description: 'The server encountered an error. Please try again later.',
  icon: WARNING_ICON,
};

/** Texts and icon of an HTTP status: its own ones, or those of its class. */
export function errorText(status: number): ErrorText {
  return ERROR_TEXTS[status] ?? (status >= 400 && status < 500 ? CLIENT_ERROR_TEXT : SERVER_ERROR_TEXT);
}

/** Label above the title: the status code, or the lack of response of the server. */
export function errorLabel(status: number): string {
  return status > 0 ? `Error ${status}` : 'Network error';
}
