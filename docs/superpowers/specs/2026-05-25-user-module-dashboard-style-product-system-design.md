# User Module Dashboard-Style Product System Design

Date: 2026-05-25
Owner: Codex
Status: Draft for user review

## Goal

Make the full user module feel like one complete, modern fitness product. The
current dashboard is the strongest visual and interaction reference, so it will
become the source of truth for the rest of the user-facing app: nutrition,
workout, measurements, water, friends, notifications, referrals, premium, and
profile.

This spec is an audit-backed design and roadmap. It does not implement code yet.

## Audit Inputs

Inspected:

- Project structure in `frontend` and `backend`.
- Existing audit/tasklist docs for auth, workout, nutrition, and API contracts.
- Recent frontend/backend commits and current dirty working tree.
- Frontend user module routes, shell, dashboard, nutrition, workout, profile,
  notification, referral, and layout code.
- Backend modules, Prisma schemas, tracking/workout/running services, auth,
  nutrition, payment, notifications, gamification, and AI usage surface.
- Authenticated Chrome route smoke audit for key user pages on localhost.
- Large file sizes, test coverage counts, fallback/mock markers, console output,
  route redirects, localization gaps, and UI consistency signals.

## What Works Well

- The dashboard has a strong mobile product feel: compact cards, clear top
  actions, bottom navigation, quick add patterns, and readable health metrics.
- The app already has a broad fitness product surface: nutrition, workout,
  running, water, measurements, friends, challenges, achievements, premium,
  referrals, notifications, reports, AI scan, and onboarding.
- Backend has serious domain primitives: Prisma models for tracking, nutrition,
  running routes, workout sessions, gamification, notifications, billing, AI
  usage, referrals, and user profile.
- Workout and running logic has already moved toward canonical state builders,
  idempotent finish flows, route filtering, and richer route persistence.
- Tests exist across frontend and backend user modules. This is a good base for
  regression protection.

## Problems Found

### Critical

- `/user/challenges` redirects to dashboard while challenge UI and links still
  exist in parts of the product. Feature flags and navigation are not fully
  aligned.
- Notifications, referrals, and profile routes emit a React duplicate key error
  with key `NaN`. This can cause unstable rendering.
- Referral page displays the raw translation key `profile.referral.subtitle`.
- Premium/payment still contains mock payment-provider behavior. This is not
  production-ready if premium is user-visible.
- Migration/deploy readiness needs stronger protection. A previous runtime
  failure showed `AiUsageTrial` table missing while AI usage APIs were live.

### High

- Dashboard quality is higher than many other pages. Nutrition, workout,
  measurements, water, referrals, and notifications use mixed shells, old
  headers, inconsistent copy, and different card density.
- Dashboard data is assembled from many frontend queries. Cross-domain state can
  become stale because there is no single backend dashboard snapshot.
- React Query invalidation is feature-local and manual. Actions in one module can
  leave another widget stale.
- Many user pages rely on fallback values and client-side derived state. This can
  hide backend contract issues.
- Localization is inconsistent across Uzbek, Russian, and English. Some visible
  strings are hardcoded or missing.

### Medium

- Several frontend components are too large for safe iteration:
  workout session, nutrition content, workout plans, workout list, running live,
  run map panel, exercise library, nutrition camera, and history detail are all
  large files.
- Several backend services are too large:
  Telegram bot, admin foods, onboarding AI, challenges, workout plans, meal
  plans, admin core, workout sessions, and profile service.
- Chat store contains console logging and mock AI behavior.
- Accessibility is uneven: many icon-only or custom clickable controls need
  consistent labels, focus states, and keyboard behavior.
- Some product areas have feature depth but weak hierarchy. Reports, history,
  friends, referrals, water, and measurements need clearer primary actions.

## Product Direction

Use the dashboard as the product grammar:

- Compact, calm, scan-friendly cards.
- Mobile-first top actions and bottom navigation.
- Bottom drawers for selections, filters, settings, profile sections, and date
  pickers.
- Clear timeline patterns for daily behavior.
- One obvious primary action per page.
- Fewer decorative cards and more purposeful metrics.
- Consistent empty, loading, error, disabled, and success states.

The goal is not only visual restyling. Every change must make the app clearer,
faster, or more reliable.

## Recommended Architecture

### Shared Frontend UI Layer

Add a user-module design layer around existing components:

- `UserModuleShell`: page surface, safe-area spacing, route-aware mobile header
  policy, and desktop sidebar alignment.
- `UserMetricCard`: dashboard-style metric cards for nutrition, workout,
  measurements, water, and reports.
- `UserTimelineCard`: day timeline rows for meals, workouts, water, history, and
  achievements.
- `UserActionRow`: avatar/date/notification/calendar/profile rows for mobile.
- `UserBottomDrawer`: consistent `max-w-md` mobile drawers with scrollable body.
- `UserFilterDrawer`: date range, tabs, search, and select controls in drawers.
- `UserEmptyState`, `UserErrorState`, `UserSkeleton`: consistent states across
  all user pages.

These should be wrappers over current shadcn/radix/vaul/lucide patterns, not a
new design system dependency.

### Shared State Contracts

Add or strengthen backend/frontend snapshot contracts where repeated derived
state exists:

- `dashboardState`: calories, meals, water, workout, measurements, mood,
  achievements, social summary, notification count.
- `nutritionState`: selected day totals, meal sections, recommended ranges,
  water, active meal, quick add availability.
- `workoutState`: active session, active plan, next workout, can start, block
  reason, progress.
- `profileState`: user identity, theme/mode/language, premium, referral, security
  summary.

Frontend can keep backward-compatible fallback normalizers, but primary UI
should render canonical backend fields where available.

### Query and Invalidation

Centralize query keys and invalidation helpers:

- `invalidateDailyTracking(date)`
- `invalidateNutritionState(date)`
- `invalidateWorkoutState()`
- `invalidateDashboardState(date)`
- `invalidateProfileState()`
- `invalidateNotifications()`

Mutations should invalidate domain snapshots, not only their immediate list.

## UX Design by Area

### Dashboard

Keep the current dashboard direction. It should remain the visual baseline.

Improve:

- Add an explicit app-wide "Today" state contract over time.
- Keep cards compact and avoid height drift.
- Ensure dashboard links always open working routes.
- Make widgets resilient when a feature is disabled.

### Nutrition

Make nutrition feel like dashboard, not a separate module.

Recommended next features:

- Overview route as the main nutrition landing.
- Calendar bottom drawer for date switching.
- Collapsible meal rows styled like dashboard `Ovqatlar`.
- History as day timeline with actual meal times and foods.
- Filter button opens bottom drawer. Date range and meal type select are nested
  drawers.
- Copy previous meal/day, favorite foods, recent foods, and quick portion presets.
- AI/barcode result drawer with stable portion editor flow.
- Food quality score and macro balance explanations.

### Workout

Workout should revolve around "what should I do next?"

Recommended next features:

- Top priority hero: active run, active strength draft, next workout, or no plan.
- One backend source for `nextWorkout`.
- Plan detail days are open for viewing, but main CTA uses canonical queue.
- Completed day redo as extra session; skipped day out of queue.
- Rest timer and session resume always visible during active session.
- Exercise detail pages with equipment, muscles, instructions, PRs, and history.
- Weekly workout schedule and recovery suggestions.

### Running

Running should remain production-oriented around route trust.

Recommended next features:

- Keep route map visible live and after finish.
- Show GPS quality state and synced/queued points state.
- Add splits/laps, route comparison, shoes/equipment tracking, and share card.
- Surface known browser GPS limitations in UX copy, not as technical error text.

### Measurements and Water

These should be small but high-value habit screens.

Recommended next features:

- Trend-first layout: latest metric, goal direction, 7/30/90 day chart.
- Compact add drawer with validation.
- Progress photo as optional, private-by-default feature.
- Water page should match dashboard water widget and show daily pattern.

### Friends, Challenges, Achievements

Social should support fitness habits, not distract from them.

Recommended next features:

- Hide disabled challenge routes everywhere or enable them fully.
- Friend activity feed with privacy controls.
- Challenge templates: steps, water, workouts, streaks.
- Mute/block/report flows for social safety.
- Achievements should map to clear milestones, not only count badges.

### Notifications

Keep it simple.

Recommended next features:

- Only `Hammasi` and `O'qilmagan` tabs on the main surface.
- Category filters should live in settings or filter drawer if needed.
- Notification settings as icon button in drawer header.
- Fixed drawer height regardless of item count.
- Quiet hours, channel preferences, and digest mode.

### Profile, Premium, Referrals

Profile should remain drawer-first.

Recommended next features:

- Nested bottom drawers for theme, security, premium, referrals, and mode.
- Fix missing referral locale key.
- Premium should show real entitlements, AI credit usage, and payment state.
- Replace mock payment behavior before public premium launch.

## Code Quality Design

### Frontend

Refactor large files by feature seams:

- Container: data fetching, route params, mutations.
- View model hook: derived state, status flags, action handlers.
- Presentational components: cards, rows, drawers, empty states.
- Normalizers: API compatibility and default values.

Priority split targets:

- `workout/plans/session/index.jsx`
- `nutrition/nutrition-content.jsx`
- `workout/plans/create/index.jsx`
- `workout/list/index.jsx`
- `workout/session-drawer.jsx`
- `workout/plans/index.jsx`
- `nutrition/camera-drawer.jsx`
- `workout/running/live/index.jsx`
- `workout/running/components/run-map-panel.jsx`
- `workout/exercises/index.jsx`

### Backend

Refactor large services into policy, query, mutation, mapper, and transaction
helpers.

Priority split targets:

- `user/telegram/liveon-app-bot.service.ts`
- `admin/foods/foods.service.ts`
- `user/onboarding/open-ai-plan.service.ts`
- `user/challenges/challenge.service.ts`
- `user/workout/workout-plans.service.ts`
- `user/meal-plans/meal-plans.service.ts`
- `user/workout/workout-sessions.service.ts`
- `user/profile/user-profile.service.ts`

### Testing

Add regression tests around observed failures:

- `/user/challenges` feature flag behavior.
- Duplicate key `NaN` on notifications/referrals/profile.
- Missing referral translation key in uz/ru/en.
- Dashboard widget links only point to enabled routes.
- Payment/premium mock provider is hidden or replaced in production mode.
- AI usage migration readiness check blocks deploy when tables are missing.

## Phased Roadmap

### Phase 0: Stabilize Current Product

- Fix route/feature-flag mismatch for challenges.
- Fix duplicate key `NaN` console error.
- Fix referral locale key.
- Audit premium/payment mock behavior.
- Add deploy/migration readiness checks for AI usage tables.

### Phase 1: Product System Foundation

- Introduce shared user module shell, card, drawer, timeline, filter, and state
  components.
- Align mobile safe-area spacing and remove old headers where policy says they
  should not appear.
- Standardize empty/loading/error states.
- Add accessibility labels and keyboard behavior to shared patterns.

### Phase 2: Nutrition and Workout Consistency

- Finish nutrition overview/history drawer model.
- Align nutrition cards with dashboard.
- Align workout overview/plans/session/history with dashboard grammar.
- Replace page-specific fallback UI with shared state contracts.

### Phase 3: Canonical State Contracts

- Add backend snapshots for dashboard, nutrition, workout, and profile.
- Centralize frontend query keys and invalidation helpers.
- Reduce client-side duplicated calculations.

### Phase 4: Product Depth

- Add copy previous meal/day, favorites/recent, meal score.
- Add workout recovery suggestions, PR tracking, weekly schedule.
- Add running route comparison, splits, shoes tracking.
- Add measurement trends and private progress photos.

### Phase 5: Production Readiness

- Replace mock payment flow.
- Add observability and error reporting for user-critical flows.
- Add e2e smoke suite for dashboard, nutrition, workout, scan, running, profile,
  and premium.
- Add CI checks for missing translation keys and console errors in smoke routes.

## Acceptance Criteria

- Main user pages visually feel like the dashboard product family.
- Mobile pages have no awkward top gaps, header collisions, or horizontal
  overflow.
- Every main page answers: where am I, what matters now, what can I do next?
- Disabled features do not expose broken links or dead routes.
- Console smoke audit has no React key errors on primary user routes.
- Missing locale keys do not render as raw keys.
- Shared components reduce repeated card/drawer/timeline code.
- Backend snapshot contracts reduce frontend fallback dependence.
- Tests cover the observed route, locale, key, and state-regression issues.

## Out of Scope for This First Implementation Cycle

- Full redesign of admin.
- Full mobile native app redesign.
- Replacing the entire API layer.
- New database schema for every product suggestion.
- Payment provider integration unless selected as the first production-readiness
  task.
- Deep AI recommendation model changes.

## Risks and Mitigations

- Risk: Too much scope for one implementation pass.
  - Mitigation: implement Phase 0 and Phase 1 first, then module-specific passes.
- Risk: Visual refactor breaks working flows.
  - Mitigation: keep route contracts and API payloads unchanged; add focused
    tests before changing high-traffic screens.
- Risk: Shared components become too generic.
  - Mitigation: create only patterns already repeated in dashboard/nutrition/
    workout.
- Risk: Backend snapshot work expands.
  - Mitigation: start with additive fields and keep old frontend fallbacks until
    coverage is proven.

## First Implementation Recommendation

Start with Phase 0 plus the minimal Phase 1 foundation:

1. Fix challenges route visibility or enable route.
2. Fix duplicate key `NaN` console error.
3. Fix referral locale key.
4. Add shared dashboard-style card/drawer/timeline primitives.
5. Apply those primitives to notifications, referrals, nutrition history filter,
   and one compact measurements/water pass.

This gives immediate visible quality improvement while lowering risk before
larger nutrition/workout state refactors.

## Spec Self-Review Notes

- No placeholder markers remain.
- No backend or frontend endpoint path changes required by this design.
- The first implementation cycle is intentionally smaller than the full roadmap.
- The design keeps existing working functionality and flags production risks
  separately from UI polish.
