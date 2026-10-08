<!--
SPDX-FileCopyrightText: Fondation RERO+
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# MEF UI

User interface of **MEF** (Multilingual Entity File), the linked entity hub of [RERO+](https://www.rero.ch).
MEF aggregates and aligns authority records from VIAF, IdRef, GND and RERO and gives a unified identifier
to persons, organisations, concepts and places.

The application, available at [mef.rero.ch](https://mef.rero.ch), provides:

- the home page, with a search field and the entity types (agents, concepts, places) with their number of
  records;
- the search of all MEF entities, with facets and sorting;
- the detail view of an entity: main record, one tab per source record (GND, IdRef, RERO), raw JSON of the
  records, related records of the redirects (`relation_pid`);
- the "How MEF linking works" page;
- a light, dark or automatic (system setting) color theme.

The data comes from the REST API of the [rero-mef](https://github.com/rero/rero-mef) backend.

## Tech stack

- [Angular](https://angular.dev) 21 (standalone components, signals, zoneless change detection, server-side
  rendering)
- [@rero/ng-core](https://github.com/rero/ng-core): search, detail view, translations and PrimeNG theme
- [PrimeNG](https://primeng.org) 21 with the ng-core preset
- [Tailwind CSS](https://tailwindcss.com) 4
- [Vitest](https://vitest.dev) for the unit tests
- [pnpm](https://pnpm.io) as package manager

## Requirements

- Node.js 24 or later
- pnpm 12 (the exact version is set in the `packageManager` field of `package.json`)

## Getting started

```bash
pnpm install
pnpm start
```

Then open <http://localhost:4200/>.

In development, the API calls (`/api/...`) go through the Angular dev server proxy (`proxy.conf.json`) to
the test server **https://mef.test.rero.ch**, so no local backend is needed (production:
https://mef.rero.ch). The proxy is required because the MEF servers don't send CORS headers: the browser
can't call them directly from `localhost`. To use a local rero-mef instance, change the `target` of
`proxy.conf.json`.

## Scripts

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `pnpm start`           | Development server with live reload and the API proxy |
| `pnpm build`           | Production build in `dist/mef-ui`                     |
| `pnpm serve:ssr`       | Production server (after `pnpm build`), port 4000     |
| `pnpm serve:ssr:local` | Same, on `localhost`, to check the server rendering   |
| `pnpm watch`           | Development build in watch mode                       |
| `pnpm test`            | Unit tests (Vitest)                                   |
| `pnpm format`          | Format the code with Prettier (imports sorted)        |
| `pnpm format:check`    | Check the formatting, without changing files (CI)     |

## Configuration

The configuration is in `src/environments/` and is read by `AppConfigService` (`src/app/app-config.service.ts`),
which extends the ng-core `CoreConfigService`.

The same production build runs on the test and production servers: the `API_URL` environment variable of the
server (`pnpm serve:ssr`) sets `apiBaseUrl` and `$refPrefix` when it starts, and the server passes them on to the
browser with the page (`RuntimeConfig`, `src/app/runtime-config.ts`). Without it, the values below apply.

```sh
API_URL=https://mef.test.rero.ch node dist/mef-ui/server/server.mjs   # test server
API_URL=https://mef.rero.ch node dist/mef-ui/server/server.mjs        # production server
```

| Key          | Development                | Production            | Usage                                               |
| ------------ | -------------------------- | --------------------- | --------------------------------------------------- |
| `apiBaseUrl` | `''` (relative URLs)       | `https://mef.rero.ch` | Base URL of the API calls made by the application   |
| `$refPrefix` | `https://mef.test.rero.ch` | `https://mef.rero.ch` | Absolute URL of the records (links to the raw JSON) |

`apiBaseUrl` must stay empty in development, otherwise the API calls bypass the proxy and are blocked by CORS: don't
set `API_URL` with `pnpm start`.

## Project structure

```
src/
├── app/
│   ├── app.config.ts          # Application providers (ng-core, PrimeNG, translations, HTTP, router)
│   ├── app.config.server.ts   # Additional providers on the server
│   ├── app.routes.server.ts   # Rendering mode of the routes on the server
│   ├── app.routes.ts          # Routes and search configuration of the record types
│   ├── theme.service.ts       # Light / dark / automatic color theme
│   ├── components/
│   │   ├── entity/            # Entities: search result (entity-brief), detail view (entity-detail),
│   │   │                      # shared components (icon, type, sources, field), model and utils
│   │   ├── error/             # Error page (404)
│   │   ├── footer/            # Footer: RERO+ brand and links
│   │   ├── frontpage/         # Home page
│   │   ├── header/            # Header: large on the home page, compact on the other pages
│   │   ├── home-search/       # Search field of the home page
│   │   ├── linking/           # "How MEF linking works" page
│   │   ├── menu/              # Header navigation (PrimeNG Menubar)
│   │   └── theme-switch/      # Color theme selector of the header
│   └── interceptors/          # HTTP interceptors (date range facets, no browser cache, page status)
├── environments/              # Configuration per environment
├── main.server.ts             # Bootstrap of the application on the server
├── server.ts                  # Node.js (Express) server: static files and server-side rendering
├── testing/                   # Test helpers
├── styles.css                 # Global styles: Tailwind, theme colors, base styles
└── test-setup.ts              # Browser APIs missing in jsdom, for the tests
```

`docker/` holds the production image (`Dockerfile`), see [Docker](#docker).

## Routes and record types

The search and detail routes of ng-core are configured in `app.routes.ts` through record types:

| URL                     | Content                    | API endpoint             |
| ----------------------- | -------------------------- | ------------------------ |
| `/`                     | Home page                  |                          |
| `/mef`                  | Search of all the entities | `/api/all/mef/`          |
| `/agents/detail/:pid`   | Detail of an agent         | `/api/agents/mef/:pid`   |
| `/concepts/detail/:pid` | Detail of a concept        | `/api/concepts/mef/:pid` |
| `/places/detail/:pid`   | Detail of a place          | `/api/places/mef/:pid`   |
| `/linking`              | How MEF linking works      |                          |

Notes:

- Only the search (`:type`) and detail (`:type/detail/:pid`) routes of ng-core are used: MEF is read only,
  and the editor routes would add the editor dependencies to the bundle.
- `agents`, `concepts` and `places` are hidden record types (`hideInTabs`), used for the detail views, so that
  a record is loaded from its own API index (the `/api/all/mef/:pid` redirect drops the query string).
- The `/linking` and error pages are lazy loaded.
- The `creation_date` and `update_date` facets use the ng-core date range widget. The
  `dateRangeAggregationInterceptor` adapts the request and response formats between the widget and the backend.
- The `noCacheInterceptor` bypasses the browser HTTP cache for the API GET requests: the `ETag` of the API
  doesn't change when only an embedded source record changes, so the browser would display old data.

## Server-side rendering

The pages are rendered on the server (Angular SSR), so that the search engines index the home page, the search
results and the detail views, then hydrated in the browser.

- **Rendering modes** (`app.routes.server.ts`): all the pages are rendered at each request, even the static ones
  (`/linking`), as they must contain the runtime configuration of the server (`API_URL`): no prerendering at build
  time. The home page is sent with `Cache-Control: public, max-age=300`: its record counts change slowly, so the
  browsers and the proxies can keep it 5 minutes. `/linking` is sent with `Cache-Control: public, max-age=3600`.
- **API calls**: the `apiTransferCacheInterceptor` transfers the API responses of the server to the browser with
  the page, so the browser doesn't request them again during the hydration. It replaces the HTTP transfer cache of
  Angular, which never stores the API responses (`Cache-Control: no-cache`, `Set-Cookie`). In development, the
  server calls go through the proxy too.
- **HTTP status**: the error page answers `404`, and the `responseStatusInterceptor` gives the page the `404` or
  `410` status of the API (unknown PID), so that the error pages are not indexed.
- **Browser APIs**: `window`, `document`, `localStorage`... don't exist on the server. Inject `DOCUMENT` and test
  `defaultView` (see `ThemeService`), or run the code in `afterNextRender()`.
- **Allowed hosts**: the server only renders the requests whose `Host` header is listed in `security.allowedHosts`
  of `angular.json` (`mef.rero.ch`, `mef.test.rero.ch`), to prevent SSRF attacks. Add a host with the
  `NG_ALLOWED_HOSTS` environment variable (comma separated); `pnpm serve:ssr:local` allows `localhost`, to
  check the server rendering of the production build locally. The browser calls of this build go to
  `https://mef.rero.ch` and are blocked by CORS (new search, facets...): use `pnpm start` to test the application.
- **Proxy headers** (`server.ts`): the server trusts the `X-Forwarded-For`, `X-Forwarded-Host` and
  `X-Forwarded-Proto` headers of the reverse proxies (`trustProxyHeaders`). With any other `X-Forwarded-*` header,
  Angular skips the server rendering and sends the empty page shell, without the runtime configuration: the browser
  then calls `https://mef.rero.ch`, blocked by CORS on the other hosts. The reverse proxies must replace these
  headers, not append to the values sent by the client.
- **Deployment**: `pnpm build` generates the browser files (`dist/mef-ui/browser`) and the server
  (`dist/mef-ui/server/server.mjs`), run with Node.js 24 (`PORT` environment variable, 4000 by default; `API_URL`,
  see [Configuration](#configuration)).
- **ng-core patch** (`patches/@rero__ng-core.patch`, applied by pnpm): two ng-core 21.3.0 lines break the server
  rendering: `RecordSearchResultComponent` reads `window.location.href`, and `easymde` (markdown editor) is
  imported statically, while CodeMirror needs the DOM as soon as it is loaded. To remove once fixed in ng-core.

## Docker

`docker/Dockerfile` builds the production image: the application is built in a Node.js image, then only the
`dist` folder is copied in a small Node.js Alpine image, as the server bundle contains its dependencies. The server
runs as the `node` user, behind `tini`, which forwards the stop signals.

```sh
docker build -f docker/Dockerfile -t mef-ui .
docker run -d -p 4000:4000 -e API_URL=https://mef.test.rero.ch mef-ui
```

The configuration is passed with environment variables, the same image runs on the test and production servers:

| Variable           | Default               | Usage                                                                |
| ------------------ | --------------------- | -------------------------------------------------------------------- |
| `API_URL`          | `https://mef.rero.ch` | Base URL of the MEF API (see [Configuration](#configuration))        |
| `NG_ALLOWED_HOSTS` |                       | Additional allowed host names, comma separated (`localhost` to test) |
| `PORT`             | `4000`                | Listening port of the server                                         |

The `Host` header of the requests must be an allowed host name, otherwise the server answers `400`: the reverse
proxy must pass on the original `Host`. It may send `X-Forwarded-For`, `X-Forwarded-Host` (an allowed host name)
and `X-Forwarded-Proto`, but no other `X-Forwarded-*` header (see [Server-side rendering](#server-side-rendering)). The health check requests a static file (`/favicon.ico`), without
rendering nor API call. The build context is filtered by `docker/Dockerfile.dockerignore`.

To test the image locally, allow `localhost`:

```sh
docker run --rm -p 4000:4000 -e API_URL=https://mef.test.rero.ch -e NG_ALLOWED_HOSTS=localhost mef-ui
```

The pages are rendered by the server with the data of `API_URL`, but the later calls of the browser to the API (new
search, facets, pagination...) are blocked by CORS, as `http://localhost:4000` is not the origin of the API.

## Styles

- **Tailwind first**: style the templates with Tailwind utility classes.
- **Semantic colors**: the content colors are declared once in the `@theme` block of `src/styles.css`
  and used as utilities: `bg-surface`, `bg-surface-muted`, `border-line`, `text-ink`, `text-ink-muted`,
  `text-heading`, `text-link`, `text-danger`... The MEF blue (`mef-blue`) is used by the header, in both
  themes.
- **Dark mode**: the `app-dark` class on `<html>` enables the dark theme, for PrimeNG (`darkModeSelector`
  in `app.config.ts`) and for Tailwind (`dark:` variant). The semantic colors take the PrimeNG dark palette
  values. The mode is chosen in the header (`ThemeService`) and applied before Angular starts by a script of
  `index.html`, to avoid a flash of the light theme.
- **ng-core and PrimeNG**: the ng-core utility classes (`core:...`) are loaded through `angular.json`, after
  `styles.css`. PrimeNG uses the ng-core preset (`primeNGConfig`), whose CSS layers let the Tailwind utilities
  override the PrimeNG component styles. Customize PrimeNG components with their design tokens (`[dt]`) or
  pass-through classes (`[pt]`).
- **Accessibility**: the pages must pass the AXE checks and follow the WCAG AA rules (contrast, focus, ARIA).

## Code conventions

- Standalone components with `ChangeDetectionStrategy.OnPush`, `input()` / `output()` functions and signals.
- Native control flow (`@if`, `@for`) in the templates.
- Prettier formats the code on save (VS Code settings in `.vscode/`), with sorted imports: third party
  imports first, then a blank line, then the project imports.
- Every source file starts with the license header:

  ```ts
  // SPDX-FileCopyrightText: Fondation RERO+
  // SPDX-License-Identifier: AGPL-3.0-or-later
  ```

  ```html
  <!--
  SPDX-FileCopyrightText: Fondation RERO+
  SPDX-License-Identifier: AGPL-3.0-or-later
  -->
  ```

  In CSS files, use a `/* ... */` comment with the same lines.

## Continuous integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) checks the formatting, runs the unit tests and
builds the application, on each push to `staging` and each pull request.

## AI assistants

- `.claude/CLAUDE.md`: project instructions (Angular best practices, accessibility).
- `.claude/skills/angular-developer`: official [Angular agent skill](https://angular.dev/ai/agent-skills),
  see `.claude/skills/README.md` to update it.
- `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code): Angular CLI MCP server (`pnpm exec ng mcp`).

## License

[GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html)
(`AGPL-3.0-or-later`), © Fondation RERO+.
