# Nutrition Scan AI Result Drawer Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix nutrition camera/gallery scan so it opens the AI result/portion editor drawer instead of immediately closing.

**Architecture:** Keep `CameraDrawer` as the owner of photo scan state. Remove the old `onInlineCameraCapture` short-circuit from the Smart Add camera path so capture/gallery always goes through `CameraDrawer.handleCapture` and `CameraResultDrawer`.

**Tech Stack:** React, Vite, Vitest, Testing Library, existing Vaul drawer wrapper, lodash.

---

## File Map

- Modify: `src/modules/user/containers/nutrition/action-drawer.jsx`
  - Stop passing `onInlineCapture` into `CameraDrawer`.
  - Remove unused `onInlineCameraCapture` prop from this component.
- Modify: `src/modules/user/containers/nutrition/nutrition-drawers.jsx`
  - Stop accepting and forwarding `handleInlineCameraCapture` to `ActionDrawer`.
- Modify: `src/modules/user/containers/nutrition/nutrition-content.jsx`
  - Stop passing `handleInlineCameraCapture` to `NutritionDrawers`.
  - Leave pending inline scan helpers intact because they are still used by existing pending scan retry/review flows.
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
  - Remove `onInlineCapture` prop and the early return in `handleCapture`.
  - Keep request id guard, result drawer open state, and save behavior unchanged.
- Modify: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`
  - Keep direct scanner regression coverage that gallery upload opens the AI result drawer and does not close.
- Create: `src/modules/user/containers/nutrition/action-drawer.test.jsx`
  - Add root-cause regression coverage for `ActionDrawer`: Smart Add camera path must not pass `onInlineCapture` to `CameraDrawer` and must not call `onCloseAll` during capture.

---

### Task 1: Add Root-Cause Regression Test

**Files:**
- Create: `src/modules/user/containers/nutrition/action-drawer.test.jsx`

- [ ] **Step 1: Create `action-drawer.test.jsx` with a failing regression test**

```jsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActionDrawer from "./action-drawer.jsx";

const mocks = vi.hoisted(() => ({
  cameraProps: null,
}));

vi.mock("@/components/ui/drawer.jsx", async () => {
  const ReactModule = await import("react");

  const MockSlot = (slot) => ({ children, className, ...props }) =>
    ReactModule.createElement(
      "div",
      { ...props, className, "data-slot": slot },
      children,
    );

  return {
    Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerBody: MockSlot("drawer-body"),
  };
});

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      user: {
        id: "user-1",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
    }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  AI_USAGE_FEATURES: {
    foodPhotoScan: "food-photo-scan",
    textMealLog: "text-meal-log",
    voiceMealLog: "voice-meal-log",
  },
  getAiAccessDisabledProps: () => ({}),
  getAiAccessStatus: () => ({ isDisabled: false }),
  useAiAccessStatus: () => ({
    wallet: { status: "trial_active", dailyLimit: 3, remainingToday: 3 },
  }),
}));

vi.mock("@/hooks/app/use-food-catalog", () => ({
  useFoodAudioTranscriptHistory: () => ({
    items: [],
    saveHistoryItem: vi.fn(),
    removeHistoryItem: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

vi.mock("./camera-drawer.jsx", () => ({
  default: (props) => {
    mocks.cameraProps = props;
    if (!props.open) return null;

    return (
      <button
        type="button"
        onClick={() => props.onInlineCapture?.("data:image/jpeg;base64,test")}
      >
        Mock camera capture
      </button>
    );
  },
}));

vi.mock("./audio-add-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./audio-transcript-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./text-add-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./manual-add-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./ai-meal-draft-drawer.jsx", () => ({
  default: () => null,
}));

beforeEach(() => {
  mocks.cameraProps = null;
});

describe("ActionDrawer camera scan flow", () => {
  it("does not route camera captures through the old inline close path", () => {
    const onCloseAll = vi.fn();
    const onInlineCameraCapture = vi.fn();

    render(
      <ActionDrawer
        open
        onOpenChange={vi.fn()}
        dateKey="2026-05-24"
        mealType="breakfast"
        onOpenSavedMeals={vi.fn()}
        onCloseAll={onCloseAll}
        onInlineCameraCapture={onInlineCameraCapture}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kamera" }));

    expect(mocks.cameraProps).toEqual(
      expect.objectContaining({
        open: true,
      }),
    );
    expect(mocks.cameraProps.onInlineCapture).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Mock camera capture" }));

    expect(onInlineCameraCapture).not.toHaveBeenCalled();
    expect(onCloseAll).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails before the implementation**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/action-drawer.test.jsx --run
```

Expected before implementation:

```text
FAIL src/modules/user/containers/nutrition/action-drawer.test.jsx
AssertionError: expected [Function] to be undefined
```

- [ ] **Step 3: Commit the failing test**

```bash
git add src/modules/user/containers/nutrition/action-drawer.test.jsx
git commit -m "test: cover nutrition camera result drawer path"
```

---

### Task 2: Remove Old Inline Capture Path From Camera Action

**Files:**
- Modify: `src/modules/user/containers/nutrition/action-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/nutrition-drawers.jsx`
- Modify: `src/modules/user/containers/nutrition/nutrition-content.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`

- [ ] **Step 1: Update `action-drawer.jsx` props**

In `ActionDrawer` props, remove `onInlineCameraCapture`:

```jsx
const ActionDrawer = ({
  open,
  onOpenChange,
  dateKey,
  mealType,
  initialNested,
  onOpenSavedMeals,
  onCloseAll,
  disabled = false,
}) => {
```

- [ ] **Step 2: Update `CameraDrawer` usage inside `action-drawer.jsx`**

Replace the current camera drawer block:

```jsx
      <CameraDrawer
        open={activeNested === "camera"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        dateKey={selectedDateKey}
        loggedAt={selectedLoggedAt}
        mealType={activeMealType}
        initialMode={cameraInitialMode}
        onInlineCapture={(dataUrl) => {
          onInlineCameraCapture?.(dataUrl, activeMealType);
          closeStackedCameraText();
          setActiveNested(null);
          onCloseAll?.();
        }}
        isStackedChildOpen={cameraTextOpen || cameraAiDraftOpen}
        onOpenText={() => {
          resetTranscriptState();
          setTextAddVariant("text");
          setInputSource("text");
          setCameraAiDraftOpen(false);
          setCameraTextOpen(true);
        }}
        onClose={() => {
          closeStackedCameraText();
          setActiveNested(null);
          onCloseAll?.();
        }}
      />
```

with:

```jsx
      <CameraDrawer
        open={activeNested === "camera"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        dateKey={selectedDateKey}
        loggedAt={selectedLoggedAt}
        mealType={activeMealType}
        initialMode={cameraInitialMode}
        isStackedChildOpen={cameraTextOpen || cameraAiDraftOpen}
        onOpenText={() => {
          resetTranscriptState();
          setTextAddVariant("text");
          setInputSource("text");
          setCameraAiDraftOpen(false);
          setCameraTextOpen(true);
        }}
        onClose={() => {
          closeStackedCameraText();
          setActiveNested(null);
          onCloseAll?.();
        }}
      />
```

- [ ] **Step 3: Update `nutrition-drawers.jsx` props**

Remove `handleInlineCameraCapture` from the `NutritionDrawers` function parameter list.

Remove this prop from `ActionDrawer`:

```jsx
        onInlineCameraCapture={handleInlineCameraCapture}
```

The resulting `ActionDrawer` usage should be:

```jsx
      <ActionDrawer
        {...getDrawerControl(isActionDrawerOpen, setIsActionDrawerOpen)}
        dateKey={dateKey}
        mealType={selectedMealTypeForAdd}
        onOpenSavedMeals={() => setIsSavedMealsOpen(true)}
        onCloseAll={() => setIsActionDrawerOpen(false)}
        disabled={!isOnline}
      />
```

- [ ] **Step 4: Update `nutrition-content.jsx` drawer props**

Remove this prop from the `NutritionDrawers` call:

```jsx
        handleInlineCameraCapture={handleInlineCameraCapture}
```

Do not remove `handleInlineCameraCapture`, `processInlineScan`, `pendingScans`, or `InlineScanReviewDrawer` in this task. They are outside this bug fix and may still support existing pending scan/retry UI.

- [ ] **Step 5: Update `camera-drawer.jsx` props**

Remove `onInlineCapture` from the component parameter list:

```jsx
export default function CameraDrawer({
  dateKey,
  loggedAt = null,
  mealType,
  open,
  onClose,
  onOpenText,
  isStackedChildOpen = false,
  initialMode = "camera",
}) {
```

- [ ] **Step 6: Remove the early return from `CameraDrawer.handleCapture`**

Delete this block:

```jsx
    if (onInlineCapture) {
      onInlineCapture(dataUrl);
      return;
    }
```

After the AI quota guard, `handleCapture` should immediately create the AI scan request id and open the result drawer.

- [ ] **Step 7: Run the focused tests**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/action-drawer.test.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected:

```text
Test Files  2 passed (2)
```

- [ ] **Step 8: Commit the implementation**

```bash
git add \
  src/modules/user/containers/nutrition/action-drawer.jsx \
  src/modules/user/containers/nutrition/nutrition-drawers.jsx \
  src/modules/user/containers/nutrition/nutrition-content.jsx \
  src/modules/user/containers/nutrition/camera-drawer.jsx
git commit -m "fix: keep nutrition camera scan in result drawer flow"
```

---

### Task 3: Verify Regressions And Build

**Files:**
- Modify: no source changes expected.

- [ ] **Step 1: Run the nutrition scan regression suite**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/action-drawer.test.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx src/modules/user/containers/nutrition/smart-add-sheet.test.jsx src/modules/user/containers/nutrition/meal-draft-review.test.js --run
```

Expected:

```text
Test Files  4 passed (4)
```

- [ ] **Step 2: Run lint for touched files**

Run:

```bash
npx eslint \
  src/components/ui/drawer.jsx \
  src/modules/user/containers/nutrition/action-drawer.jsx \
  src/modules/user/containers/nutrition/action-drawer.test.jsx \
  src/modules/user/containers/nutrition/camera-drawer.jsx \
  src/modules/user/containers/nutrition/camera-result-drawer.jsx \
  src/modules/user/containers/nutrition/camera-drawer.test.jsx \
  src/modules/user/containers/nutrition/nutrition-drawers.jsx \
  src/modules/user/containers/nutrition/nutrition-content.jsx \
  --max-warnings=0
```

Expected:

```text
No output, exit code 0
```

- [ ] **Step 3: Run the frontend production build**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

Existing bundle-size or MapLibre tolerated transform warnings may still appear; they are not part of this fix.

- [ ] **Step 4: Commit any test-only cleanup if needed**

If Task 3 required any additional test/import cleanup, commit it:

```bash
git add src/modules/user/containers/nutrition
git commit -m "test: stabilize nutrition scan drawer regression"
```

If no cleanup was needed, do not create an empty commit.
