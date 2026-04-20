# Coach Frontend Refactor Guide

## Routing

- Keep `pages/{feature}/index.jsx` as a one-line page wrapper.
- Put route orchestration in `containers/{feature}/index.jsx`.
- Default each feature route to `list`, then nest `create` and `edit/:id` under it.
- Remove legacy redirects as each feature is migrated to nested routes.

## Container Structure

- Split feature UI into `list`, `create`, `edit`, and `components` folders.
- Keep list containers focused on table state, filters, bulk actions, and drawer routing.
- Keep create and edit containers thin; both should reuse a single form drawer component.
- Target subcontainers under 500 LOC and move repeated table logic into shared helpers.

## Data Layer

- Use `lib/api/coach-*-api.js` for all HTTP calls.
- Use `lib/hooks/useCoach*.js` for React Query wiring and invalidation.
- Keep query keys scoped under `["coach", resource]`.
- Prefer URL state via `nuqs`; use Zustand only for ephemeral UI state that should not live in the URL.

## Store Conventions

- `useCoachSelectionStore` holds per-resource row selection.
- `useCoachDrawerStore` holds drawer open state and payloads.
- `useCoachFiltersStore` is only for non-URL filters.
- Co-locate resource-specific stores under `modules/coach/store/`.
- Keep backward-compatibility shims in `src/store/` only while non-coach modules still import them.

## Form Pattern

- Use a single `{Feature}FormDrawer.jsx` per resource.
- Build forms with `react-hook-form` and `zod`.
- Keep payload normalization close to the form drawer, not inside route containers.
- Show explicit loading, empty, and error states at every async boundary.

## Shared UI

- Reuse `components/data-grid-helpers/` for list headers, lifecycle tabs, bulk actions, refresh buttons, and async states.
- Keep resource-specific columns, filters, and action menus next to the list container.
