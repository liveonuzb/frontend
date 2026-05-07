## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Frontend AI Rules

- Scope: all new or modified API-backed table/entity flows across `src/modules/admin`, `src/modules/coach`, and `src/modules/user` must follow the admin achievements pattern in `src/modules/admin/containers/achievements/*`.
- Tabular UI must use the DataGrid stack from `src/components/reui/data-grid`; do not add raw/custom table implementations for API-backed lists.
- Admin list pages must use `AdminListPageShell`, `AdminListHeader`, `AdminListToolbar`, and `AdminListDataGrid` from `src/modules/admin/components/admin-list-shell.jsx`; keep table columns in `list/columns.jsx`.
- Pagination, sorting, and filters should be URL/query-state driven, usually with `nuqs`; use `useReactTable` with manual pagination/sorting for server-backed lists.
- Reorderable lists should use the achievement-style DataGrid DnD components: `DataGridTableDndRows` and `DataGridTableDndRowHandle`.
- Backend integration must use hooks from `@/hooks/api`: `useGetQuery`, `usePostQuery`, `usePatchQuery`, and when needed `useDeleteQuery`.
- Mutation calls should follow the achievement pattern: `mutateAsync({ url, attributes, config })`, with cache invalidation handled through feature query keys and `queryKey`/`listKey`.
- Keep feature query keys and API helpers next to the feature, for example `ADMIN_ACHIEVEMENTS_QUERY_KEY`; do not move API-backed entity cache into global Zustand stores.
- API-backed list/detail/entity data must use React Query as the source of truth. Zustand is only for session/UI state such as auth, language, app mode, breadcrumbs, drawer state, selection state, and local drafts.
- Existing legacy tables do not need a forced migration unless the task touches that flow. When a task touches a legacy/non-conforming table or API-backed entity flow and the new work depends on the current pattern, migrate that flow to the DataGrid + React Query pattern within the same task instead of layering new code on top of legacy structure.
