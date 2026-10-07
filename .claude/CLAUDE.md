## Angular

Only the rules beyond Angular defaults are listed here; they replace the `get_best_practices` tool of the
`angular-cli` MCP: do not call it, nor `list_projects` (a single workspace at the root).

- Standalone components, without `standalone: true` (the default); `ChangeDetectionStrategy.OnPush`; inline
  templates for small components.
- `input()`, `output()`, `inject()`, signals with `computed()`; `set`/`update`, never `mutate`.
- Host bindings in the `host` object, never `@HostBinding`/`@HostListener`.
- `class`/`style` bindings, never `ngClass`/`ngStyle`; native control flow (`@if`, `@for`, `@switch`).
- Reactive forms (not template-driven, nor signal forms); lazy-loaded feature routes; `providedIn: 'root'` services.
- `NgOptimizedImage` for static images (not inline base64); no globals such as `new Date()` in templates.
- Accessibility: pass all AXE checks and WCAG AA (focus management, color contrast, ARIA attributes).

## Project

Angular 21 (zoneless), pnpm 12, @rero/ng-core and PrimeNG 21, Tailwind CSS 4. Read-only client of the MEF REST API
(see README.md).

## TypeScript style

- Strict typing: avoid `any`, use `unknown` when the type is uncertain; rely on inference when the type is obvious.
- Prefer object destructuring over repeating `obj.prop`.
- Use dot notation (`obj.prop`), except on index signatures (`Record<string, unknown>`):
  `noPropertyAccessFromIndexSignature` requires `obj['prop']` there.
- Avoid `Record<string, any>`: use a typed interface or type alias instead.

## Architecture

- One responsibility per component and per service.
- Keep templates simple: move logic into `computed()` or pure functions, and keep state transformations pure.
- Keep components thin and focused on the UI; put reusable logic in pure functions (e.g. `entity.utils.ts`,
  `entity-detail/field-values.ts`).

## Testing (Vitest)

- Use the Vitest API (`vi.fn()`, `vi.spyOn()`); never Karma or Jasmine.
- The app is zoneless: never use `fakeAsync`, `tick` or `flush`.
- Prefer pure function tests; use TestBed only for dependency injection, rendering, directives or pipes.
- `await router.navigate()`; use `vi.resetAllMocks()` (not `vi.clearAllMocks()`) in `afterEach`.

## Commands

`pnpm start` (with the API proxy), `pnpm test --watch=false`, `pnpm build`, `pnpm format:check`.

## Commits

Commit messages follow Conventional Commits; the `commit-message` skill holds the conventions and the workflow, so
invoke it instead of writing one by hand. In every case, whatever the default of the harness, never sign a commit as
an LLM: no Claude or Anthropic trailer.
