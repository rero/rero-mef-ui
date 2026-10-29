// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { inject } from '@angular/core';
import { Route, Router, Routes, UrlSegment } from '@angular/router';
import { Bucket, ngCoreRoutes, RecordType } from '@rero/ng-core';
import { Observable, of } from 'rxjs';

import { EntityBrief } from './components/entity/entity-brief/entity-brief';
import { EntityDetail } from './components/entity/entity-detail/entity-detail';
import { ENTITY_CATEGORIES, ENTITY_TYPES, isEntityCategory, isEntityType } from './components/entity/entity.model';
import { Frontpage } from './components/frontpage/frontpage';

const recordTypes: Partial<RecordType>[] = [
  {
    key: 'mef',
    index: 'all/mef',
    label: 'mef',
    component: EntityBrief,
    canAdd: () => of({ can: false, message: '' }),
    showLabel: false,
    allowEmptySearch: true,
    preFilters: { with_deleted: 'true' },
    pagination: {
      boundaryLinks: false,
      maxSize: 10,
      pageReport: false,
      rowsPerPageOptions: [10, 25, 50],
    },
    searchFilters: [
      {
        label: 'Deleted',
        filter: 'deleted',
        value: 'true',
      },
      {
        label: 'Has relation',
        filter: 'has_relation',
        value: 'true',
      },
      {
        label: '⚠️ Cross-type-redirect',
        filter: 'type_conflict',
        value: 'true',
      },
    ],
    // Sort direction in the labels, as the icons are not read by screen readers. Without `-`,
    // ascending: A to Z, oldest first.
    sortOptions: [
      {
        label: 'Relevance',
        // `-`: descending `_score` (most relevant first), as the backend default sort
        value: '-relevance',
        defaultQuery: true,
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Authorized access point (A to Z)',
        value: 'authorized_access_point',
        icon: 'fa-solid fa-arrow-down-a-z',
      },
      {
        label: 'Authorized access point (Z to A)',
        value: '-authorized_access_point',
        icon: 'fa-solid fa-arrow-up-a-z',
      },
      {
        label: 'Date changed (oldest first)',
        value: 'date_changed',
        defaultNoQuery: true,
        icon: 'fa-solid fa-arrow-down-short-wide',
      },
      {
        label: 'Date changed (newest first)',
        value: '-date_changed',
        defaultNoQuery: true,
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Date created (oldest first)',
        value: 'date_created',
        icon: 'fa-solid fa-arrow-down-short-wide',
      },
      {
        label: 'Date created (newest first)',
        value: '-date_created',
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'PID',
        value: 'pid',
        icon: 'fa-solid fa-arrow-down-1-9',
      },
    ],
    aggregationsOrder: ['entity', 'source', 'type', 'country_associated', 'creation_date', 'update_date'],
    aggregationsName: {
      entity: 'Entity',
      source: 'Source',
      type: 'Type',
      country_associated: 'Country associated',
      creation_date: 'Created',
      update_date: 'Updated',
    },
    aggregationsExpand: ['entity', 'source', 'type'],
    processBucketName,
  },
  // One hidden type per entity, used by the detail view: each entity has its own API index,
  // so the record is loaded directly from it (/api/agents/mef/:pid?resolve=1) instead of
  // through the /api/all/mef/:pid redirect, which drops the query string.
  ...ENTITY_CATEGORIES.map(({ key: entity }) => ({
    key: entity,
    index: `${entity}/mef`,
    label: entity,
    component: EntityBrief,
    detailComponent: EntityDetail,
    canAdd: () => of({ can: false, message: '' }),
    showLabel: false,
    hideInTabs: true,
  })),
];

/**
 * Search and detail routes of ng-core (`ngCoreRoutes`): MEF is read only, so the editor routes of
 * `@rero/ng-core/editor` are left out.
 */
const recordRoutes: Routes = [
  // The entity types are hidden types without facets (detail view only): their search, e.g.
  // `/agents?q=Goethe`, opens the MEF search filtered on the entity, `/mef?q=Goethe&entity=agents`.
  {
    matcher: (segments: UrlSegment[]) =>
      segments.length === 1 && isEntityCategory(segments[0].path)
        ? { consumed: segments, posParams: { type: segments[0] } }
        : null,
    redirectTo: ({ params: { type }, queryParams }) =>
      inject(Router).createUrlTree(['/mef'], { queryParams: { ...queryParams, entity: type } }),
  },
  ...ngCoreRoutes,
];

export const routes: Routes = [
  {
    path: '',
    component: Frontpage,
    title: 'Home',
  },
  {
    path: 'linking',
    loadComponent: () => import('./components/linking/linking').then((m) => m.Linking),
    title: 'Linking',
  },
  {
    path: '',
    canMatch: [(_route: Route, segments: UrlSegment[]) => recordTypes.some((type) => type.key === segments[0]?.path)],
    data: {
      adminMode: false,
      types: recordTypes,
    },
    children: recordRoutes,
  },
  {
    path: '**',
    loadComponent: () => import('./components/error/error').then((m) => m.Error),
    title: 'Page not found',
    data: {
      status: 404,
      title: 'Page not found',
    },
  },
];

/**
 * Label displayed for a facet bucket.
 * Must return an Observable: ng-core subscribes to it (`label$`) in the facet template.
 */
function processBucketName(bucket: Bucket): Observable<string> {
  if (isEntityType(bucket.key)) {
    return of(ENTITY_TYPES[bucket.key].name);
  }
  return of(bucket.name ?? bucket.key);
}
