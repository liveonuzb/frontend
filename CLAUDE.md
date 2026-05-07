# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Preview production build:** `npm run preview`

No test runner is configured.

## Tech Stack

React 19 + Vite 7, JavaScript (JSX, no TypeScript). Tailwind CSS v4 with shadcn/ui (radix-maia style, JSX mode). Uses `@reui` registry from reui.io for additional components.

## Path Alias

`@/` maps to `./src/` (configured in both vite.config.js and jsconfig.json).

## Architecture

### Module Structure

The app is organized by role-based modules under `src/modules/`:

- **auth** — sign-in, sign-up, forgot-password, OTP verify, reset-password
- **onboarding** — user onboarding wizard (pre-dashboard)
- **coach-onboarding** — coach-specific onboarding
- **admin** — admin dashboard (role-gated: ADMIN)
- **coach** — coach dashboard (role-gated: COACH)
- **user** — main user dashboard (largest module, lazy-loaded pages)

Each module has its own `index.jsx` that defines `<Routes>` with a layout wrapper. Modules are independently routed via `src/router/index.jsx`.

### Module Internal Pattern

Modules follow a pages → containers pattern:
- `pages/[page-name]/index.jsx` — thin wrapper that renders a container
- `containers/[page-name]/index.jsx` — actual UI and logic

### Routing & Auth Flow

`src/router/index.jsx` conditionally renders route trees based on auth state:
1. **Not authenticated** → only `/auth/*` routes available, everything else redirects to sign-in
2. **Authenticated but onboarding incomplete** → only `/onboarding/*` routes, everything else redirects there
3. **Authenticated + onboarded** → role-based routes (admin, coach, user) with `<ProtectedRoute allowedRoles={[...]}>` for role gating

### State Management

Zustand stores in `src/store/`, all exported from `src/store/index.js`:
- **useAuthStore** — auth tokens, user data, roles, activeRole, onboarding status (persisted to localStorage as `auth-storage`)
- **useLanguageStore** — current UI language (persisted as `language-storage`, default: "uz")
- **useOnboardingStore** — onboarding form data (persisted as `onboarding-storage`)
- **useBreadcrumbStore** — breadcrumb navigation (not persisted)

Frontend-wide API-backed list/detail/entity data must not be stored in Zustand. React Query is the source of truth for backend data. Zustand remains valid only for session/UI state such as auth, language, app mode, breadcrumbs, drawer state, selection state, and local drafts.

### Admin Module Rule

Admin module has a stricter rule than the rest of the app: API-backed admin entity data must be fetched in the consuming page/container with React Query, not stored in Zustand. Only `useAuthStore`, `useLanguageStore`, and `useBreadcrumbStore` are allowed there for session/UI state. See `src/modules/admin/ROLE.md`.

Admin module also follows a stricter structure rule:
- `pages/[feature]/index.jsx` should stay a thin wrapper that renders the feature container only
- `containers/[feature]/index.jsx` is the stable feature entry point
- subviews should live under `containers/[feature]/list|overview|create|edit|detail|tabs`
- feature-local API helpers and query keys should stay inside the same feature folder

### Table and Entity Flow Rule

All new or modified API-backed table/entity flows across admin, coach, and user modules must follow the admin achievements pattern in `src/modules/admin/containers/achievements/*`.

- Tabular UI must use the DataGrid stack from `src/components/reui/data-grid`; do not add raw/custom table implementations for API-backed lists.
- Admin list pages must use `AdminListPageShell`, `AdminListHeader`, `AdminListToolbar`, and `AdminListDataGrid` from `src/modules/admin/components/admin-list-shell.jsx`.
- Keep feature table columns in `list/columns.jsx`, filters in a local list filter helper/component, and route entrypoints in the existing pages -> containers structure.
- Pagination, sorting, and filters should be URL/query-state driven, usually with `nuqs`.
- Server-backed lists should use `useReactTable` with manual pagination/sorting and query params passed into `useGetQuery`.
- Reorderable lists should use the achievement-style DataGrid DnD components: `DataGridTableDndRows` and `DataGridTableDndRowHandle`.
- Existing legacy tables do not need a forced migration unless the task touches that flow. When a task touches a legacy/non-conforming table or API-backed entity flow and the new work depends on the current pattern, migrate that flow to the DataGrid + React Query pattern within the same task instead of layering new code on top of legacy structure.

### API Layer

`src/hooks/api/use-api.js` creates a shared Axios instance with:
- Base URL from `src/config.js`
- Auto-attaches Bearer token and Accept-Language header via interceptors
- 401 response triggers automatic token refresh via `/auth/refresh`, with request queuing
- On refresh failure, forces logout and redirects to `/auth/sign-in`

Query hooks in `src/hooks/api/` wrap TanStack React Query v5:
- `useGetQuery` — `useQuery` wrapper with online-status check
- `usePostQuery`, `usePutQuery`, `usePatchQuery`, `useDeleteQuery` — `useMutation` wrappers that auto-invalidate queries via `queryKey`/`listKey`
- `usePostFileQuery` — file upload mutations
- `useGetWithPostQuery` — fetches data using POST method (for complex query params)

Usage pattern: `useGetQuery({ url: "/endpoint", params: {}, queryProps: { queryKey: ["key"] } })`

Backend integration must go through hooks from `@/hooks/api`: `useGetQuery`, `usePostQuery`, `usePatchQuery`, and when needed `useDeleteQuery`. Mutation calls should follow the achievement pattern: `mutateAsync({ url, attributes, config })`, with cache invalidation handled through feature query keys and `queryKey`/`listKey`. Keep feature query keys and API helpers next to the feature, for example `ADMIN_ACHIEVEMENTS_QUERY_KEY`.

### Providers

`src/providers/index.jsx` wraps the app with: NuqsAdapter → React Query → GetMe → TooltipProvider + Toaster.

`GetMe` provider fetches `/me` on mount when authenticated and stores user data in auth store.

### UI Components

- `src/components/ui/` — shadcn/ui + reui primitives (button, input, select, tabs, sidebar, etc.)
- `src/components/` — app-level components (error-boundary, page-loader, protected-route, nav-user, etc.)
- Utility: `cn()` from `src/lib/utils.js` (clsx + tailwind-merge)
- URL query state managed via `nuqs` with react-router v7 adapter
- Form handling: react-hook-form + zod (v4) + @hookform/resolvers
- Icons: lucide-react
- Toasts: sonner
