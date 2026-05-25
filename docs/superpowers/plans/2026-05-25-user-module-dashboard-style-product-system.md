# User Module Dashboard-Style Product System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the user module and start aligning non-dashboard pages to the dashboard product system without breaking existing user flows.

**Architecture:** Keep existing routes and APIs intact. First fix observed production-readiness and UI consistency bugs, then add a small shared user-surface component layer that later pages can adopt incrementally.

**Tech Stack:** Vite React, React Router, Vitest, Testing Library, Tailwind/shadcn/vaul/lucide, NestJS, Prisma, Jest, Node scripts.

---

## Scope

This plan implements the first cycle from the approved design:

1. Challenge feature flag/route visibility consistency.
2. Notification feed simplification and stable React keys.
3. Referral missing locale and stable React keys.
4. Minimal shared dashboard-style user UI primitives.
5. Production-readiness guard for mock payments.
6. Deploy readiness check for AI usage Prisma tables.

Large backend dashboard snapshots, full nutrition/workout refactors, and payment provider integration are separate follow-up plans.

## File Structure

Frontend files:

- Modify `src/modules/user/user-feature-flags.js`: keep feature flags and expose route helper functions.
- Modify `src/modules/user/index.jsx`: use helper functions for hidden user feature routes.
- Modify `src/modules/user/layout/user-nav-items.js`: use the same feature helper for sidebar nav items.
- Modify `src/modules/user/index.test.jsx`: assert hidden routes still redirect through the centralized feature helper.
- Modify `src/modules/user/layout/user-nav-items.test.js`: assert hidden nav items are absent.
- Create `src/modules/user/containers/notifications/notification-feed-utils.js`: stable keys and notification tab metadata.
- Create `src/modules/user/containers/notifications/notification-feed-utils.test.js`: key and tab unit tests.
- Modify `src/modules/user/containers/notifications/index.jsx`: remove category filter pills, use all/unread tabs only, stable keys, fixed-height feed surface.
- Create `src/modules/user/components/user-surface.jsx`: shared dashboard-style card/timeline/empty primitives.
- Create `src/modules/user/components/user-surface.test.jsx`: rendering and class contract tests.
- Modify `src/modules/user/containers/referrals/index.jsx`: use shared surface for page wrapper.
- Create `src/modules/profile/components/referral/referral-dashboard.keys.js`: stable keys for leaderboard/referral/xp/withdrawal lists.
- Create `src/modules/profile/components/referral/referral-dashboard.keys.test.js`: key fallback tests.
- Modify `src/modules/profile/components/referral/referral-dashboard.jsx`: use stable key helpers.
- Modify `src/modules/profile/components/referral/referral-dashboard.test.jsx`: assert subtitle renders and duplicate key warnings are avoided.
- Modify `src/modules/profile/lib/locales/uz.json`, `ru.json`, `en.json`: add `profile.referral.subtitle`.

Backend files:

- Modify `backend/src/common/env.validation.ts`: add `PAYMENT_MOCK_PROVIDER_ENABLED` and production guard.
- Modify `backend/src/common/env.validation.spec.ts`: cover the production guard.
- Modify `backend/src/modules/user/payments/payments.service.ts`: inject `ConfigService` and reject mock checkout when disabled.
- Modify `backend/src/modules/user/payments/payments.service.spec.ts`: cover allowed dev mock and blocked production mock.
- Modify `backend/src/modules/billing/payments/payments.module.ts`: import `ConfigModule` if needed for local provider clarity.
- Modify `backend/.env.example`: document `PAYMENT_MOCK_PROVIDER_ENABLED`.
- Modify `backend/scripts/check-deploy-readiness.cjs`: include AI usage tables in required table checks.

---

### Task 1: Centralize User Feature Visibility

**Files:**
- Modify: `frontend/src/modules/user/user-feature-flags.js`
- Modify: `frontend/src/modules/user/index.jsx`
- Modify: `frontend/src/modules/user/layout/user-nav-items.js`
- Modify: `frontend/src/modules/user/index.test.jsx`
- Modify: `frontend/src/modules/user/layout/user-nav-items.test.js`

- [ ] **Step 1: Write the feature-helper tests**

Add these assertions to `frontend/src/modules/user/layout/user-nav-items.test.js`:

```js
import {
  USER_FEATURE_ROUTE_PREFIXES,
  isUserFeatureEnabled,
  isUserFeatureRouteEnabled,
} from "@/modules/user/user-feature-flags.js";

it("uses the centralized feature helper for hidden routes", () => {
  expect(isUserFeatureEnabled("challenges")).toBe(false);
  expect(isUserFeatureEnabled("leaderboard")).toBe(false);
  expect(isUserFeatureRouteEnabled("/user/challenges")).toBe(false);
  expect(isUserFeatureRouteEnabled("/user/challenges/challenge-1")).toBe(false);
  expect(isUserFeatureRouteEnabled("/user/leaderboard")).toBe(false);
  expect(isUserFeatureRouteEnabled("/user/dashboard")).toBe(true);
  expect(USER_FEATURE_ROUTE_PREFIXES.challenges).toBe("/user/challenges");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/layout/user-nav-items.test.js src/modules/user/index.test.jsx --run
```

Expected: `isUserFeatureEnabled` or `isUserFeatureRouteEnabled` is not exported.

- [ ] **Step 3: Implement the feature helper**

Replace `frontend/src/modules/user/user-feature-flags.js` with:

```js
export const USER_FEATURES = {
  challenges: false,
  leaderboard: false,
};

export const USER_FEATURE_ROUTE_PREFIXES = {
  challenges: "/user/challenges",
  leaderboard: "/user/leaderboard",
};

export const USER_CHALLENGES_ENABLED = USER_FEATURES.challenges;
export const USER_LEADERBOARD_ENABLED = USER_FEATURES.leaderboard;

export const isUserFeatureEnabled = (feature) =>
  Boolean(USER_FEATURES[feature]);

export const isUserFeatureRouteEnabled = (pathname = "") => {
  const path = String(pathname || "");

  return !Object.entries(USER_FEATURE_ROUTE_PREFIXES).some(
    ([feature, prefix]) =>
      path.startsWith(prefix) && !isUserFeatureEnabled(feature),
  );
};
```

- [ ] **Step 4: Use the helper in routes**

In `frontend/src/modules/user/index.jsx`, keep imports for legacy constants if useful, and add:

```js
import { isUserFeatureEnabled } from "@/modules/user/user-feature-flags.js";
```

Replace the challenges route condition with:

```jsx
{isUserFeatureEnabled("challenges") ? (
  <Suspense fallback={<PageLoader />}>
    <ErrorBoundary>
      <ChallengesPage />
    </ErrorBoundary>
  </Suspense>
) : (
  <Navigate to="/user/dashboard" replace />
)}
```

Replace the leaderboard route condition with:

```jsx
{isUserFeatureEnabled("leaderboard") ? (
  <Suspense fallback={<PageLoader />}>
    <ErrorBoundary>
      <LeaderboardPage />
    </ErrorBoundary>
  </Suspense>
) : (
  <Navigate to="/user/dashboard" replace />
)}
```

- [ ] **Step 5: Use the helper in user nav items**

In `frontend/src/modules/user/layout/user-nav-items.js`, import:

```js
import { isUserFeatureEnabled } from "@/modules/user/user-feature-flags.js";
```

Replace the conditional nav entries with:

```js
isUserFeatureEnabled("challenges")
  ? {
      to: "/user/challenges",
      label: "Musobaqalar",
      icon: TrophyIcon,
    }
  : null,
isUserFeatureEnabled("leaderboard")
  ? {
      to: "/user/leaderboard",
      label: "Reyting",
      icon: MedalIcon,
    }
  : null,
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/layout/user-nav-items.test.js src/modules/user/index.test.jsx --run
```

Expected: tests pass and hidden routes still redirect to `/user/dashboard`.

- [ ] **Step 7: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/user-feature-flags.js src/modules/user/index.jsx src/modules/user/layout/user-nav-items.js src/modules/user/index.test.jsx src/modules/user/layout/user-nav-items.test.js
git commit -m "fix: centralize hidden user feature routes"
```

---

### Task 2: Simplify Notifications and Remove Unstable Keys

**Files:**
- Create: `frontend/src/modules/user/containers/notifications/notification-feed-utils.js`
- Create: `frontend/src/modules/user/containers/notifications/notification-feed-utils.test.js`
- Modify: `frontend/src/modules/user/containers/notifications/index.jsx`

- [ ] **Step 1: Write utility tests**

Create `frontend/src/modules/user/containers/notifications/notification-feed-utils.test.js`:

```js
import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TABS,
  getNotificationItemKey,
} from "./notification-feed-utils.js";

describe("notification-feed-utils", () => {
  it("keeps only all and unread tabs", () => {
    expect(NOTIFICATION_TABS).toEqual([
      { value: "all", label: "Hammasi" },
      { value: "unread", label: "O'qilmagan" },
    ]);
  });

  it("uses id when available", () => {
    expect(getNotificationItemKey({ id: "notif-1" }, 0)).toBe("notif-1");
  });

  it("creates stable fallback keys for missing ids", () => {
    expect(
      getNotificationItemKey(
        {
          type: "SYSTEM",
          createdAt: "2026-05-25T10:00:00.000Z",
          title: "Test",
        },
        3,
      ),
    ).toBe("SYSTEM-2026-05-25T10:00:00.000Z-Test-3");
  });

  it("never returns NaN as a key", () => {
    expect(getNotificationItemKey({ id: Number.NaN }, 1)).toBe(
      "notification-unknown-untitled-1",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/containers/notifications/notification-feed-utils.test.js --run
```

Expected: module not found.

- [ ] **Step 3: Add notification utilities**

Create `frontend/src/modules/user/containers/notifications/notification-feed-utils.js`:

```js
export const NOTIFICATION_TABS = [
  { value: "all", label: "Hammasi" },
  { value: "unread", label: "O'qilmagan" },
];

const cleanKeyPart = (value, fallback) => {
  const text = String(value ?? "").trim();
  return text && text !== "NaN" ? text : fallback;
};

export const getNotificationItemKey = (notification = {}, index = 0) => {
  const id = cleanKeyPart(notification.id, "");

  if (id) {
    return id;
  }

  return [
    cleanKeyPart(notification.type, "notification"),
    cleanKeyPart(notification.createdAt, "unknown"),
    cleanKeyPart(notification.title, "untitled"),
    index,
  ].join("-");
};
```

- [ ] **Step 4: Update notification page imports**

In `frontend/src/modules/user/containers/notifications/index.jsx`, remove unused category imports and constants:

```diff
-  FilterIcon,
```

Remove `CATEGORY_OPTIONS` and `selectedCategory` state.

Add:

```js
import {
  NOTIFICATION_TABS,
  getNotificationItemKey,
} from "./notification-feed-utils.js";
```

- [ ] **Step 5: Use only all/unread tabs**

Replace the tab header block in `index.jsx` with:

```jsx
<TabsList>
  {map(NOTIFICATION_TABS, (tab) => (
    <TabsTrigger key={tab.value} value={tab.value}>
      {tab.label}
      {tab.value === "unread" && unreadCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-1.5 h-5 min-w-5 px-1 text-xs"
        >
          {unreadCount}
        </Badge>
      )}
    </TabsTrigger>
  ))}
</TabsList>
```

Call `useUserNotificationsFeed` without category:

```js
const {
  items,
  isLoading,
  hasMore,
  unreadCount,
  loadMore,
  markNotificationRead,
  markAllNotificationsRead,
  isUpdatingNotificationState,
} = useUserNotificationsFeed({ filter });
```

- [ ] **Step 6: Use stable keys and fixed feed height**

Change both `Card` instances around notification lists to:

```jsx
<Card className="min-h-[28rem] overflow-hidden">
  <CardContent className="p-0">
```

Change list mapping in both tabs to:

```jsx
{map(filteredItems, (notif, index) => (
  <NotificationItem
    key={getNotificationItemKey(notif, index)}
    notification={notif}
    onMarkRead={markNotificationRead}
  />
))}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/containers/notifications/notification-feed-utils.test.js --run
```

Expected: utility tests pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/containers/notifications/index.jsx src/modules/user/containers/notifications/notification-feed-utils.js src/modules/user/containers/notifications/notification-feed-utils.test.js
git commit -m "fix: simplify notification feed tabs"
```

---

### Task 3: Fix Referral Locale and Stable List Keys

**Files:**
- Create: `frontend/src/modules/profile/components/referral/referral-dashboard.keys.js`
- Create: `frontend/src/modules/profile/components/referral/referral-dashboard.keys.test.js`
- Modify: `frontend/src/modules/profile/components/referral/referral-dashboard.jsx`
- Modify: `frontend/src/modules/profile/components/referral/referral-dashboard.test.jsx`
- Modify: `frontend/src/modules/profile/lib/locales/uz.json`
- Modify: `frontend/src/modules/profile/lib/locales/ru.json`
- Modify: `frontend/src/modules/profile/lib/locales/en.json`

- [ ] **Step 1: Write key-helper tests**

Create `frontend/src/modules/profile/components/referral/referral-dashboard.keys.test.js`:

```js
import { describe, expect, it } from "vitest";
import {
  getLeaderboardKey,
  getReferralKey,
  getWithdrawalKey,
  getXpTransactionKey,
} from "./referral-dashboard.keys.js";

describe("referral-dashboard.keys", () => {
  it("uses stable leaderboard identity before rank", () => {
    expect(getLeaderboardKey({ userId: "user-1", rank: Number.NaN }, 0)).toBe(
      "leaderboard-user-1",
    );
  });

  it("falls back without returning NaN for leaderboard rows", () => {
    expect(getLeaderboardKey({ rank: Number.NaN }, 2)).toBe(
      "leaderboard-row-2",
    );
  });

  it("creates referral keys from id or code", () => {
    expect(getReferralKey({ id: "ref-1" }, 0)).toBe("referral-ref-1");
    expect(getReferralKey({ referralCode: "LIVEON" }, 1)).toBe(
      "referral-LIVEON",
    );
  });

  it("creates xp and withdrawal keys from id or index", () => {
    expect(getXpTransactionKey({ id: "xp-1" }, 0)).toBe("xp-xp-1");
    expect(getWithdrawalKey({}, 4)).toBe("withdrawal-row-4");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/profile/components/referral/referral-dashboard.keys.test.js --run
```

Expected: module not found.

- [ ] **Step 3: Add key helpers**

Create `frontend/src/modules/profile/components/referral/referral-dashboard.keys.js`:

```js
const clean = (value) => {
  const text = String(value ?? "").trim();
  return text && text !== "NaN" ? text : "";
};

export const getLeaderboardKey = (item = {}, index = 0) => {
  const identity = clean(item.userId) || clean(item.id) || clean(item.username);
  return identity ? `leaderboard-${identity}` : `leaderboard-row-${index}`;
};

export const getReferralKey = (item = {}, index = 0) => {
  const identity =
    clean(item.id) || clean(item.userId) || clean(item.referralCode);
  return identity ? `referral-${identity}` : `referral-row-${index}`;
};

export const getXpTransactionKey = (item = {}, index = 0) => {
  const identity = clean(item.id) || clean(item.createdAt) || clean(item.reason);
  return identity ? `xp-${identity}` : `xp-row-${index}`;
};

export const getWithdrawalKey = (item = {}, index = 0) => {
  const identity = clean(item.id) || clean(item.createdAt) || clean(item.status);
  return identity ? `withdrawal-${identity}` : `withdrawal-row-${index}`;
};
```

- [ ] **Step 4: Use key helpers in ReferralDashboard**

In `frontend/src/modules/profile/components/referral/referral-dashboard.jsx`, add:

```js
import {
  getLeaderboardKey,
  getReferralKey,
  getWithdrawalKey,
  getXpTransactionKey,
} from "./referral-dashboard.keys.js";
```

Replace these keys:

```diff
- key={item.rank}
+ key={getLeaderboardKey(item, index)}
```

Use this mapping signature:

```jsx
{map(leaderboard, (item, index) => {
```

Replace:

```diff
- <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
+ <div key={getReferralKey(item, index)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
```

Use:

```jsx
{map(referrals, (item, index) => {
```

Replace XP transaction keys:

```diff
- <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
+ <div key={getXpTransactionKey(tx, index)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
```

Use:

```jsx
{map(allXpTransactions, (tx, index) => {
```

Replace withdrawal keys:

```diff
- <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
+ <div key={getWithdrawalKey(w, index)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
```

Use:

```jsx
{map(withdrawals, (w, index) => {
```

- [ ] **Step 5: Add referral subtitle locales**

In each `frontend/src/modules/profile/lib/locales/*.json`, inside `profile.referral`, add:

Uzbek:

```json
"subtitle": "Do'stlaringizni taklif qiling, XP oling va premium bonuslardan foydalaning."
```

Russian:

```json
"subtitle": "Приглашайте друзей, получайте XP и используйте премиум-бонусы."
```

English:

```json
"subtitle": "Invite friends, earn XP, and unlock premium bonuses."
```

- [ ] **Step 6: Extend ReferralDashboard test**

In `frontend/src/modules/profile/components/referral/referral-dashboard.test.jsx`, update the `react-i18next` mock to return useful referral subtitle copy:

```js
const translations = {
  "profile.referral.subtitle":
    "Invite friends, earn XP, and unlock premium bonuses.",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) =>
      translations[key] ||
      (typeof options === "string" ? options : options.defaultValue || key),
  }),
}));
```

Add this assertion to the wrapped referral info test:

```js
expect(
  screen.getByText("Invite friends, earn XP, and unlock premium bonuses."),
).toBeInTheDocument();
expect(screen.queryByText("profile.referral.subtitle")).not.toBeInTheDocument();
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/profile/components/referral/referral-dashboard.keys.test.js src/modules/profile/components/referral/referral-dashboard.test.jsx --run
```

Expected: tests pass and no raw `profile.referral.subtitle` is rendered.

- [ ] **Step 8: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/profile/components/referral/referral-dashboard.jsx src/modules/profile/components/referral/referral-dashboard.test.jsx src/modules/profile/components/referral/referral-dashboard.keys.js src/modules/profile/components/referral/referral-dashboard.keys.test.js src/modules/profile/lib/locales/uz.json src/modules/profile/lib/locales/ru.json src/modules/profile/lib/locales/en.json
git commit -m "fix: stabilize referral dashboard rendering"
```

---

### Task 4: Add Minimal Dashboard-Style User Surface Primitives

**Files:**
- Create: `frontend/src/modules/user/components/user-surface.jsx`
- Create: `frontend/src/modules/user/components/user-surface.test.jsx`
- Modify: `frontend/src/modules/user/containers/referrals/index.jsx`
- Modify: `frontend/src/modules/user/containers/notifications/index.jsx`

- [ ] **Step 1: Write component tests**

Create `frontend/src/modules/user/components/user-surface.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  UserEmptyState,
  UserSectionHeader,
  UserSurface,
  UserTimelineRow,
} from "./user-surface.jsx";

describe("user-surface components", () => {
  it("renders a dashboard-style surface", () => {
    render(<UserSurface data-testid="surface">Content</UserSurface>);

    const surface = screen.getByTestId("surface");
    expect(surface).toHaveTextContent("Content");
    expect(surface.className).toContain("rounded-[28px]");
    expect(surface.className).toContain("border");
  });

  it("renders a compact section header", () => {
    render(
      <UserSectionHeader
        eyebrow="Tracking"
        title="Ovqatlar"
        action={<button type="button">Barchasi</button>}
      />,
    );

    expect(screen.getByText("Tracking")).toBeInTheDocument();
    expect(screen.getByText("Ovqatlar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Barchasi" })).toBeInTheDocument();
  });

  it("renders a timeline row with action", () => {
    render(
      <UserTimelineRow
        icon={<span aria-hidden="true">A</span>}
        title="Nonushta"
        description="614 - 830 kcal"
        meta="Kutilmoqda"
        action={<button type="button">Qo'shish</button>}
      />,
    );

    expect(screen.getByText("Nonushta")).toBeInTheDocument();
    expect(screen.getByText("614 - 830 kcal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qo'shish" })).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<UserEmptyState title="Ma'lumot yo'q" description="Keyinroq urinib ko'ring" />);

    expect(screen.getByText("Ma'lumot yo'q")).toBeInTheDocument();
    expect(screen.getByText("Keyinroq urinib ko'ring")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/components/user-surface.test.jsx --run
```

Expected: module not found.

- [ ] **Step 3: Add shared components**

Create `frontend/src/modules/user/components/user-surface.jsx`:

```jsx
import React from "react";
import { cn } from "@/lib/utils";

const toneClassName = {
  default:
    "border-[rgb(var(--accent-rgb)/0.14)] bg-card/95 shadow-sm shadow-black/[0.03]",
  accent:
    "border-[rgb(var(--accent-rgb)/0.22)] bg-[linear-gradient(135deg,hsl(var(--card)),rgb(var(--accent-rgb)/0.07))] shadow-sm shadow-[rgb(var(--accent-rgb)/0.04)]",
  muted: "border-border/60 bg-muted/20 shadow-sm shadow-black/[0.02]",
};

export const UserSurface = React.forwardRef(function UserSurface(
  { as: Comp = "section", tone = "default", className, children, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        "rounded-[28px] border px-4 py-4 text-card-foreground sm:px-5 sm:py-5",
        toneClassName[tone] || toneClassName.default,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

export function UserSectionHeader({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-bold tracking-normal text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function UserTimelineRow({
  icon,
  title,
  description,
  meta,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-3",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
          {meta ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function UserEmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-snug text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Use UserSurface in notifications**

In `frontend/src/modules/user/containers/notifications/index.jsx`, replace `Card`/`CardContent` wrappers around the feed with:

```jsx
<UserSurface className="min-h-[28rem] overflow-hidden p-0">
  ...
</UserSurface>
```

Add import:

```js
import { UserSurface } from "@/modules/user/components/user-surface.jsx";
```

Remove unused `Card` and `CardContent` imports once both wrappers are replaced.

- [ ] **Step 5: Use UserSurface in referrals wrapper**

In `frontend/src/modules/user/containers/referrals/index.jsx`, import:

```js
import {
  UserSectionHeader,
  UserSurface,
} from "@/modules/user/components/user-surface.jsx";
```

Replace the header block with:

```jsx
<UserSurface tone="accent" className="space-y-0">
  <UserSectionHeader
    eyebrow={t("profile.referral.pageTitle", "Referallar")}
    title={t("profile.referral.title", "Referallar")}
    description={t(
      "profile.referral.pageSubtitle",
      "Do'stlaringizni taklif qiling va XP oling",
    )}
    action={
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full"
        onClick={() => navigate(-1)}
        aria-label={t("common.back", "Orqaga")}
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </Button>
    }
  />
</UserSurface>
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/components/user-surface.test.jsx src/modules/user/containers/notifications/notification-feed-utils.test.js src/modules/profile/components/referral/referral-dashboard.test.jsx --run
```

Expected: tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/components/user-surface.jsx src/modules/user/components/user-surface.test.jsx src/modules/user/containers/notifications/index.jsx src/modules/user/containers/referrals/index.jsx
git commit -m "feat: add dashboard-style user surfaces"
```

---

### Task 5: Block Mock Payments in Production

**Files:**
- Modify: `backend/src/common/env.validation.ts`
- Modify: `backend/src/common/env.validation.spec.ts`
- Modify: `backend/src/modules/user/payments/payments.service.ts`
- Modify: `backend/src/modules/user/payments/payments.service.spec.ts`
- Modify: `backend/src/modules/billing/payments/payments.module.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Write env validation tests**

Add to `backend/src/common/env.validation.spec.ts`:

```ts
it('rejects mock payments in production', () => {
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGINS = 'https://app.liveon.uz';
  process.env.PAYMENT_MOCK_PROVIDER_ENABLED = 'true';

  expect(() => validateEnvironment()).toThrow(
    /PAYMENT_MOCK_PROVIDER_ENABLED must not be true in production/,
  );
});

it('allows mock payments in test mode', () => {
  process.env.NODE_ENV = 'test';
  process.env.PAYMENT_MOCK_PROVIDER_ENABLED = 'true';

  expect(() => validateEnvironment()).not.toThrow();
});
```

- [ ] **Step 2: Write payment service tests**

In `backend/src/modules/user/payments/payments.service.spec.ts`, add a config mock:

```ts
const createMockConfig = (values: Record<string, string | undefined> = {}) => ({
  get: jest.fn((key: string) => values[key]),
});
```

Change `beforeEach` service construction to:

```ts
service = new PaymentsService(
  prisma as never,
  createMockConfig({ PAYMENT_MOCK_PROVIDER_ENABLED: 'true' }) as never,
);
```

Add tests:

```ts
it('creates a mock checkout only when mock provider is enabled', async () => {
  prisma.paymentTransaction.create.mockResolvedValue({
    id: 'payment-1',
    amount: 120_000,
  });

  await expect(
    service.createCheckoutSession('user-1', {
      amount: 120_000,
      type: PaymentType.SUBSCRIPTION,
      description: 'Premium',
      metadata: {},
    }),
  ).resolves.toEqual({
    transactionId: 'payment-1',
    paymentUrl:
      'https://mock-payment-gateway.uz/pay?id=payment-1&amount=120000',
  });
});

it('rejects checkout when mock provider is disabled', async () => {
  service = new PaymentsService(
    prisma as never,
    createMockConfig({ PAYMENT_MOCK_PROVIDER_ENABLED: 'false' }) as never,
  );

  await expect(
    service.createCheckoutSession('user-1', {
      amount: 120_000,
      type: PaymentType.SUBSCRIPTION,
      description: 'Premium',
      metadata: {},
    }),
  ).rejects.toThrow('Payment provider is not configured.');
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
npm test -- src/common/env.validation.spec.ts src/modules/user/payments/payments.service.spec.ts --runInBand
```

Expected: tests fail because `PAYMENT_MOCK_PROVIDER_ENABLED` and the new constructor dependency are not implemented.

- [ ] **Step 4: Add env validation**

In `backend/src/common/env.validation.ts`, add to `envSchema` near payment providers:

```ts
PAYMENT_MOCK_PROVIDER_ENABLED: z.string().optional().default('true'),
```

Inside the production block, after the webhook secret check, add:

```ts
if (result.data.PAYMENT_MOCK_PROVIDER_ENABLED === 'true') {
  throw new Error(
    'Environment validation failed:\nPAYMENT_MOCK_PROVIDER_ENABLED must not be true in production.',
  );
}
```

- [ ] **Step 5: Update PaymentsService**

In `backend/src/modules/user/payments/payments.service.ts`, update imports:

```ts
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
```

Change constructor:

```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
) {}
```

Add this helper:

```ts
private isMockProviderEnabled() {
  return (
    this.configService.get<string>('PAYMENT_MOCK_PROVIDER_ENABLED') !== 'false'
  );
}
```

At the start of `createCheckoutSession`, before creating a transaction, add:

```ts
if (!this.isMockProviderEnabled()) {
  throw new ServiceUnavailableException('Payment provider is not configured.');
}
```

- [ ] **Step 6: Update billing payments module**

In `backend/src/modules/billing/payments/payments.module.ts`, import `ConfigModule`:

```ts
import { ConfigModule } from '@nestjs/config';
```

Update module metadata:

```ts
@Module({
  imports: [ConfigModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
```

- [ ] **Step 7: Update env example**

Add to `backend/.env.example` near payment settings:

```env
PAYMENT_MOCK_PROVIDER_ENABLED="true"
```

- [ ] **Step 8: Run focused backend tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
npm test -- src/common/env.validation.spec.ts src/modules/user/payments/payments.service.spec.ts --runInBand
```

Expected: tests pass.

- [ ] **Step 9: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
git add src/common/env.validation.ts src/common/env.validation.spec.ts src/modules/user/payments/payments.service.ts src/modules/user/payments/payments.service.spec.ts src/modules/billing/payments/payments.module.ts .env.example
git commit -m "fix: block mock payments in production"
```

---

### Task 6: Add AI Usage Tables to Deploy Readiness

**Files:**
- Modify: `backend/scripts/check-deploy-readiness.cjs`

- [ ] **Step 1: Add script-level verification command**

Run this command before editing:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
node - <<'NODE'
const fs = require('node:fs');
const source = fs.readFileSync('scripts/check-deploy-readiness.cjs', 'utf8');
for (const table of ['AiUsageTrial', 'AiUsageDailyQuota', 'AiUsageEvent']) {
  if (!source.includes(`'${table}'`)) {
    console.error(`missing ${table}`);
    process.exitCode = 1;
  }
}
NODE
```

Expected: prints at least `missing AiUsageTrial`.

- [ ] **Step 2: Update required tables**

In `backend/scripts/check-deploy-readiness.cjs`, replace:

```js
const REQUIRED_TABLES = ['AdminPermissionGrant', 'IngredientRegionalPrice'];
```

with:

```js
const REQUIRED_TABLES = [
  'AdminPermissionGrant',
  'IngredientRegionalPrice',
  'AiUsageTrial',
  'AiUsageDailyQuota',
  'AiUsageEvent',
];
```

- [ ] **Step 3: Re-run script-level verification**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
node - <<'NODE'
const fs = require('node:fs');
const source = fs.readFileSync('scripts/check-deploy-readiness.cjs', 'utf8');
for (const table of ['AiUsageTrial', 'AiUsageDailyQuota', 'AiUsageEvent']) {
  if (!source.includes(`'${table}'`)) {
    console.error(`missing ${table}`);
    process.exit(1);
  }
}
console.log('AI usage deploy readiness tables are covered.');
NODE
```

Expected: `AI usage deploy readiness tables are covered.`

- [ ] **Step 4: Commit**

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
git add scripts/check-deploy-readiness.cjs
git commit -m "fix: check ai usage tables before deploy"
```

---

### Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused frontend tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm test -- src/modules/user/layout/user-nav-items.test.js src/modules/user/index.test.jsx src/modules/user/containers/notifications/notification-feed-utils.test.js src/modules/profile/components/referral/referral-dashboard.keys.test.js src/modules/profile/components/referral/referral-dashboard.test.jsx src/modules/user/components/user-surface.test.jsx --run
```

Expected: all selected frontend tests pass.

- [ ] **Step 2: Run focused backend tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
npm test -- src/common/env.validation.spec.ts src/modules/user/payments/payments.service.spec.ts --runInBand
```

Expected: all selected backend tests pass.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
npm run build
```

Expected: Vite production build completes.

- [ ] **Step 4: Run backend build**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
npm run build
```

Expected: Prisma client generation and Nest build complete.

- [ ] **Step 5: Browser smoke check**

With the local app running, inspect:

- `/user/dashboard`
- `/user/notifications`
- `/user/referrals`
- `/user/challenges`

Expected:

- Dashboard still renders.
- Notifications show only `Hammasi` and `O'qilmagan` tabs on the main surface.
- Referrals do not show `profile.referral.subtitle`.
- `/user/challenges` redirects to `/user/dashboard` while feature flag is false.
- Browser console does not show duplicate key `NaN` for notifications/referrals.

- [ ] **Step 6: Final status check**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git status --short
cd /Users/shoxruxshomurodov/Desktop/Liveon/backend
git status --short
```

Expected:

- Only pre-existing unrelated dirty frontend changes remain.
- Backend is clean after the backend commits.

---

## Execution Notes

- Do not revert the existing dirty frontend nutrition/layout worktree changes.
- Commit frontend and backend changes in their own repositories.
- Keep frontend visual changes restrained. Dashboard is the visual reference.
- Do not add new dependencies.
- Do not enable hidden challenges unless product explicitly decides to launch it.
- Payment provider integration is not part of this cycle; this cycle prevents mock checkout from being production-enabled.
