// SPDX-FileCopyrightText: Fondation RERO+
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ActivatedRouteSnapshot, Route, Routes, UrlSegment } from '@angular/router';
import { Bucket, DetailComponent, RecordSearchPageComponent, RecordType, typeResolver } from '@rero/ng-core';
import { Observable, of } from 'rxjs';

import { EntityBrief } from './components/entity/entity-brief/entity-brief';
import { EntityDetail } from './components/entity/entity-detail/entity-detail';
import { ENTITY_CATEGORIES, ENTITY_TYPES, isEntityType } from './components/entity/entity.model';
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
    sortOptions: [
      {
        label: 'Relevance',
        // `-`: descending `_score` (most relevant first), as the backend default sort
        value: '-relevance',
        defaultQuery: true,
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Authorized access point (newest)',
        value: 'authorized_access_point',
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Date changed (newest)',
        value: 'date_changed',
        defaultNoQuery: true,
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Date changed (oldest)',
        value: '-date_changed',
        defaultNoQuery: true,
        icon: 'fa-solid fa-arrow-down-short-wide',
      },
      {
        label: 'Date created (newest)',
        value: 'date_created',
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'Date created (oldest)',
        value: '-date_created',
        icon: 'fa-solid fa-arrow-down-short-wide',
      },
      {
        label: 'Type',
        value: 'type',
        icon: 'fa-solid fa-arrow-down-wide-short',
      },
      {
        label: 'PID',
        value: 'pid',
        icon: 'fa-solid fa-arrow-down-wide-short',
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

/** Record types of the closest parent route (`inheritTypesResolver` of ng-core, not exported). */
function inheritTypes(route: ActivatedRouteSnapshot): Partial<RecordType>[] {
  for (let parent = route.parent; parent; parent = parent.parent) {
    if (parent.data['types']) {
      return parent.data['types'];
    }
  }
  return [];
}

/**
 * Search and detail routes of ng-core (`ngCoreRoutes`), without the editor ones (`:type/new`,
 * `:type/edit/:pid`): MEF is read only, and the editor dependencies (formly, CodeMirror, KaTeX...)
 * would be included in the bundle.
 */
const recordRoutes: Routes = [
  { path: ':type', title: typeResolver, component: RecordSearchPageComponent },
  {
    path: ':type/detail/:pid',
    title: typeResolver,
    component: DetailComponent,
    resolve: { types: inheritTypes },
  },
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
      description: 'The page you are looking for does not exist.',
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
