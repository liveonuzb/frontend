# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + React frontend. The app starts in `src/main.jsx`, routes live in `src/router`, and shared providers live in `src/providers`. Domain features are grouped under `src/modules`, including `admin`, `auth`, `onboarding`, `profile`, and `user`. Shared UI belongs in `src/components`, hooks in `src/hooks`, utilities and i18n in `src/lib`, and Zustand stores in `src/store`. Static assets are kept in `public`; build and QA helpers are in `scripts`; Docker files are at the root and `docker/`.

## API Hook Pattern

Use the API wrappers from `@/hooks/api` for frontend requests. In admin module work, keep GET and mutation hooks inside the relevant `src/modules/admin` component/container instead of adding new shared `src/hooks/app` wrappers unless explicitly requested. Follow the local pattern:

```jsx
const { data, isLoading } = useGetQuery({
  url: `/admin/achievements/${id}`,
  queryProps: {
    queryKey: getAdminAchievementQueryKey(id),
    enabled: Boolean(id),
  },
});

const { mutateAsync, isPending } = usePatchQuery({
  queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
});
```

For GET calls, always provide a stable `queryProps.queryKey` that includes ids, filters, pagination, search, language, or other response-changing inputs. For POST/PATCH/PUT/DELETE/file mutations, create the mutation hook in the component/container with the root `queryKey` and optional `listKey`, then pass `url`, `attributes`, and optional `config` to `mutateAsync`.

## App Mode Assets

Mode-aware UI and images must account for all three app modes: `madagascar`, `zen`, and `focus`. Use `APP_MODES` from `src/store/app-mode-store.js` and follow the existing achievement image pattern when storing per-mode admin images: `imageMadagascarUrl`, `imageZenUrl`, and `imageFocusUrl`.

Before adding mode-specific static imagery, check `public/madagascar`, `public/zen`, and `public/focus`. If a suitable image does not exist for a required mode, generate a real PNG asset that matches that mode instead of silently reusing an unrelated mode image. Save generated static assets under the matching mode folder with descriptive kebab-case filenames; for admin-managed entities, use the existing upload/image-picker flow and make sure each required mode image can be populated.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server on port `3030`.
- `npm run build`: create the production bundle in `dist`.
- `npm run preview`: serve the built bundle locally.
- `npm run lint`: run ESLint across the project.
- `npm test`: run Vitest unit and component tests.
- `npm run test:e2e:running`: run the Playwright running-flow spec configured under `e2e/`.
- `npm run qa:running:real-gps`: execute the real GPS QA helper script.

## Coding Style & Naming Conventions

Use JavaScript and JSX ES modules with 2-space indentation, double quotes, and semicolons. Prefer functional React components and hooks. Use the `@/` alias for imports from `src`. Name route/page entry files `index.jsx`; name helpers with kebab-case, such as `running-point-sync.js`; keep component filenames descriptive and lowercase unless a local pattern requires PascalCase. ESLint is configured in `eslint.config.js`; fix warnings where practical before opening a PR.

## Testing Guidelines

Vitest uses `jsdom`, Testing Library, and `src/test/setup.js`. Keep tests near the code they cover as `*.test.js` or `*.test.jsx`; the include pattern is `src/**/*.{test,spec}.{js,jsx}`. Mock network, router, i18n, and store boundaries explicitly. Add focused regression tests for bug fixes and update Playwright specs in `e2e/` for user-visible flows.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries, sometimes prefixed with `feat:` or `test`, for example `Fix running finish payload contract` and `test workout logs and exercises`. Keep commits focused and mention the affected feature. Pull requests should include a concise description, linked issue or task when available, test commands run, and screenshots or recordings for UI changes.

## Security & Configuration Tips

Use `.env.example` as the local configuration template. Do not commit secrets or production API values. Runtime API configuration is exposed through `VITE_API_BASE_URL`; Docker runtime configuration is handled by `docker/40-runtime-config.sh` and `public/app-config.js`.
