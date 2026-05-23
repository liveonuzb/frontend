# Nutrition Scan Result Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the nutrition scanner compact and consistent, remove the visible trial label, and show both AI and Barcode scan results in a separate nested bottom drawer.

**Architecture:** Keep `CameraDrawer` as the scanner coordinator and extract result rendering into a focused `camera-result-drawer.jsx` module. The main drawer stays on the scanner surface while a nested result drawer handles AI analyzing/review and barcode lookup/manual-entry states. Existing hooks and backend contracts remain unchanged.

**Tech Stack:** React, Vite, Vitest, Testing Library, Tailwind, Vaul-based drawer components, `html5-qrcode`, existing nutrition hooks.

---

## File Structure

- Create: `src/modules/user/containers/nutrition/camera-result-drawer.jsx`
  - Owns the nested result drawer shell.
  - Renders AI analyzing/ready/empty/error content.
  - Renders Barcode loading/found/not-found/error content.
  - Receives all actions and data from `CameraDrawer`; it does not call API hooks itself.

- Create: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`
  - Covers scanner shell, no trial label, compact preview, nested AI result drawer, nested barcode result drawer, found/manual add flows, and close-to-scanner behavior.

- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
  - Removes `AiAccessStatusText` rendering from scanner header.
  - Keeps scanner drawer in camera view while AI/barcode results open in nested drawer.
  - Adds compact preview `data-testid`.
  - Wires AI capture and barcode scan transitions to the nested result drawer.
  - Keeps existing add, save, recent meal, meal date/time, and close behavior.

## Task 1: Add Scanner Regression Tests

**Files:**
- Create: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`

- [ ] **Step 1: Create the test scaffold**

Create `src/modules/user/containers/nutrition/camera-drawer.test.jsx` with this scaffold. It uses local mocks so tests do not require real camera, Vaul portals, `html5-qrcode`, auth stores, or backend calls.

```jsx
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CameraDrawer from "./camera-drawer.jsx";

const addMealMock = vi.fn();
const createSavedMealMock = vi.fn();
const lookupFoodByBarcodeMock = vi.fn();
const uploadMealCaptureMock = vi.fn();
const analyzeMealImageDraftMock = vi.fn();
const onCloseMock = vi.fn();
const onOpenTextMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
let aiAccessDisabled = false;

vi.mock("@/components/ui/drawer.jsx", async () => {
  const ReactModule = await import("react");

  const MockSlot = (slot) => ({ children, className, ...props }) =>
    ReactModule.createElement(
      "div",
      { ...props, className, "data-slot": slot },
      children,
    );

  return {
    Drawer: ({ open, children }) =>
      open ? ReactModule.createElement("div", { "data-slot": "drawer" }, children) : null,
    DrawerBody: MockSlot("drawer-body"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("./nutrition-drawer-layout.jsx", async () => {
  const ReactModule = await import("react");

  return {
    NutritionDrawerContent: ({ children, className }) =>
      ReactModule.createElement(
        "div",
        { className, "data-testid": "nutrition-drawer-content" },
        children,
      ),
  };
});

vi.mock("@/components/barcode-scanner", async () => {
  const ReactModule = await import("react");

  return {
    default: ({ onScan }) =>
      ReactModule.createElement(
        "button",
        {
          type: "button",
          onClick: () => onScan("5449000000996"),
        },
        "Mock barcode scanner",
      ),
  };
});

vi.mock("@/hooks/app/use-food-catalog", () => ({
  useFoodBarcodeLookup: () => ({
    lookupFoodByBarcode: lookupFoodByBarcodeMock,
    isLookingUp: false,
  }),
  useFoodScan: () => ({
    analyzeMealImageDraft: analyzeMealImageDraftMock,
    uploadMealCapture: uploadMealCaptureMock,
    isAnalyzingDraftImage: false,
    isUploadingCapture: false,
  }),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: addMealMock,
  }),
}));

vi.mock("@/hooks/app/use-saved-meals", () => ({
  useSavedMeals: () => ({
    items: [],
    isLoading: false,
  }),
  useSavedMealsActions: () => ({
    createSavedMeal: createSavedMealMock,
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: {
      calories: 2200,
      protein: 120,
      carbs: 240,
      fat: 70,
    },
  }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  getAiAccessStatus: () => ({
    isDisabled: aiAccessDisabled,
  }),
  isAiAccessLimitError: () => false,
  useAiAccessStatus: () => ({
    access: {
      status: "trial_not_started",
      dailyLimit: 3,
      remainingToday: 3,
    },
  }),
}));

vi.mock("@/components/ai-access", async () => {
  const ReactModule = await import("react");

  return {
    AiAccessStatusText: () =>
      ReactModule.createElement("p", {}, "7 kun trial"),
  };
});

vi.mock("@/store/language-store", () => ({
  default: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      user: {
        id: "user-1",
        profile: {},
      },
    }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

class MockFileReader {
  result = "data:image/jpeg;base64,meal";

  readAsDataURL() {
    this.onload?.();
  }
}

const renderDrawer = (props = {}) =>
  render(
    <CameraDrawer
      open
      dateKey="2026-05-24"
      mealType="breakfast"
      loggedAt={null}
      onClose={onCloseMock}
      onOpenText={onOpenTextMock}
      {...props}
    />,
  );

beforeEach(() => {
  aiAccessDisabled = false;
  vi.stubGlobal("FileReader", MockFileReader);
  addMealMock.mockReset();
  createSavedMealMock.mockReset();
  lookupFoodByBarcodeMock.mockReset();
  uploadMealCaptureMock.mockReset();
  analyzeMealImageDraftMock.mockReset();
  onCloseMock.mockReset();
  onOpenTextMock.mockReset();
  toastErrorMock.mockReset();
  toastSuccessMock.mockReset();
});

describe("CameraDrawer scanner shell", () => {
  it("hides the AI trial label and renders a compact scanner preview", () => {
    renderDrawer();

    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
    expect(screen.queryByText("7 kun trial")).not.toBeInTheDocument();
    expect(screen.getByTestId("nutrition-scan-preview")).toHaveStyle({
      aspectRatio: "4 / 5",
    });
  });
});
```

- [ ] **Step 2: Run the scaffold test and verify it fails**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: FAIL because `nutrition-scan-preview` does not exist and `7 kun trial` is still rendered by the current header mock.

- [ ] **Step 3: Keep the red test uncommitted**

Do not commit the failing scaffold. Keep the red test in the working tree and make it pass in Task 3, then commit the test and implementation together.

## Task 2: Extract Nested Result Drawer Component

**Files:**
- Create: `src/modules/user/containers/nutrition/camera-result-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`

- [ ] **Step 1: Create `camera-result-drawer.jsx` with the drawer shell**

Add this file. It should import the existing shared drawer primitives and receive all data/actions by props.

```jsx
import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { MealDraftCard, MealDraftSummaryCard } from "./meal-draft-review.jsx";
import SaveToMyMealsButton from "./save-to-my-meals-button.jsx";
import { BarcodeIcon, CheckIcon, Loader2Icon, PlusIcon, RefreshCcwIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { map } from "lodash";

const barcodeMacroInputs = [
  { key: "cal", label: "Kcal" },
  { key: "protein", label: "Oqsil" },
  { key: "carbs", label: "Uglevod" },
  { key: "fat", label: "Yog'" },
];

const AiAnalyzingContent = ({ imageUrl }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
    <div className="relative size-36 overflow-hidden rounded-full bg-muted">
      {imageUrl ? (
        <img src={imageUrl} alt="Scan qilinayotgan rasm" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-4xl">🍽️</div>
      )}
      <div className="absolute inset-x-0 top-0 h-1/2 animate-pulse bg-white/70" />
    </div>
    <h3 className="mt-6 text-xl font-black tracking-tight">AI tahlil qilmoqda</h3>
    <p className="mt-2 max-w-xs text-sm font-semibold text-muted-foreground">
      Ovqat va porsiyalar taxmin qilinyapti.
    </p>
  </div>
);

const AiEmptyContent = ({ imageUrl, scanError, onRetake }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
    <div className="grid size-20 place-items-center rounded-full bg-muted text-3xl">🍽️</div>
    <h3 className="mt-5 text-xl font-black">Ovqat aniqlanmadi</h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
      {scanError || "Rasmni qayta olib ko'ring yoki boshqa burchakdan oling."}
    </p>
    {imageUrl ? (
      <img src={imageUrl} alt="Aniqlanmagan ovqat rasmi" className="mt-5 max-h-36 rounded-2xl object-cover" />
    ) : null}
    <Button type="button" className="mt-6 rounded-full" onClick={onRetake}>
      Qayta olish
    </Button>
  </div>
);

const AiReadyContent = ({
  items,
  imageUrl,
  scanError,
  goals,
  saveToMyMeals,
  onSaveToMyMealsChange,
  onRetake,
  onIngredientUpdate,
  onIngredientRemove,
  onIngredientAdd,
  onRemove,
  onConfirm,
}) => (
  <div className="space-y-4">
    {imageUrl ? (
      <div className="relative w-full overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: "4 / 3" }}>
        <img src={imageUrl} alt="Ovqat rasmi" className="h-full max-h-[260px] w-full object-cover" />
        <button
          type="button"
          onClick={onRetake}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          aria-label="Qayta olish"
        >
          <RefreshCwIcon className="size-4" />
        </button>
      </div>
    ) : null}
    <MealDraftSummaryCard
      items={items}
      goals={goals}
      emptyTitle="Ovqat aniqlanmadi"
      emptyDescription={scanError || "Rasmni qayta olib ko'ring yoki boshqa burchakdan oling."}
    />
    <div className="space-y-3">
      {map(items, (item) => (
        <MealDraftCard
          key={item.id}
          item={item}
          onIngredientUpdate={(ingredientId, ingredient) =>
            onIngredientUpdate(item.id, ingredientId, ingredient)
          }
          onIngredientRemove={(ingredientId) =>
            onIngredientRemove(item.id, ingredientId)
          }
          onIngredientAdd={(ingredient) => onIngredientAdd(item.id, ingredient)}
          onRemove={() => onRemove(item.id)}
          onConfirm={() => onConfirm(item.id)}
        />
      ))}
    </div>
    <div className="rounded-2xl border bg-card p-3">
      <SaveToMyMealsButton
        checked={saveToMyMeals}
        onCheckedChange={onSaveToMyMealsChange}
      />
    </div>
  </div>
);

const BarcodeLoadingContent = ({ scannedCode }) => (
  <div className="rounded-3xl border bg-card p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
        <Loader2Icon className="size-5 animate-spin text-primary" />
      </div>
      <div>
        <p className="text-sm font-black">Barcode tekshirilmoqda</p>
        <p className="text-xs text-muted-foreground">{scannedCode}</p>
      </div>
    </div>
  </div>
);

const BarcodeFoundContent = ({
  amount,
  foundFood,
  foundMacros,
  onAddFoundFood,
  onAmountChange,
  onReset,
  scannedCode,
}) => (
  <div className="rounded-3xl border bg-card p-4 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted">
        {foundFood.image ? (
          <img src={foundFood.image} alt={foundFood.name} className="size-full object-cover" />
        ) : (
          <BarcodeIcon className="size-7 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
          <CheckIcon className="size-3" />
          Topildi
        </div>
        <h3 className="truncate text-lg font-black">{foundFood.name}</h3>
        <p className="text-xs font-semibold text-muted-foreground">{scannedCode}</p>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-4 gap-2">
      {map([
        ["Kcal", foundMacros.cal],
        ["Oqsil", `${foundMacros.protein}g`],
        ["Uglevod", `${foundMacros.carbs}g`],
        ["Yog'", `${foundMacros.fat}g`],
      ], ([label, value]) => (
        <div key={label} className="rounded-2xl bg-muted/60 px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
          <p className="text-sm font-black">{value}</p>
        </div>
      ))}
    </div>
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">Miqdori</span>
        <span className="text-xl font-black text-primary">
          {amount}
          {foundFood.unit || "g"}
        </span>
      </div>
      <Slider
        value={[amount]}
        min={foundFood.step || 10}
        max={foundFood.unit !== "g" && foundFood.unit !== "ml" ? (foundFood.step || 1) * 20 : 1000}
        step={foundFood.step || 10}
        onValueChange={([value]) => onAmountChange(value)}
      />
    </div>
    <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
      <Button type="button" variant="outline" size="icon" onClick={onReset} aria-label="Qayta skanerlash">
        <RefreshCcwIcon className="size-4" />
      </Button>
      <Button type="button" onClick={onAddFoundFood}>
        <PlusIcon className="mr-2 size-4" />
        Qo'shish
      </Button>
    </div>
  </div>
);

const BarcodeManualContent = ({
  manualFood,
  onAddManualFood,
  onManualFieldChange,
  onReset,
  scannedCode,
  title = "Ovqatni qo'l bilan kiriting",
}) => (
  <div className="rounded-3xl border bg-card p-4 shadow-sm">
    <div className="mb-5">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600">
        <BarcodeIcon className="size-3" />
        Topilmadi
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="text-xs font-semibold text-muted-foreground">
        Barcode: {scannedCode || "noma'lum"}
      </p>
    </div>
    <div className="space-y-3">
      <Input
        placeholder="Ovqat nomi"
        value={manualFood.name}
        onChange={(event) => onManualFieldChange("name", event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        {map(barcodeMacroInputs, (item) => (
          <label key={item.key} className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={manualFood[item.key]}
              onChange={(event) => onManualFieldChange(item.key, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <label className="space-y-1">
          <span className="text-xs font-bold text-muted-foreground">Miqdor</span>
          <Input
            type="number"
            inputMode="decimal"
            min="1"
            value={manualFood.grams}
            onChange={(event) => onManualFieldChange("grams", event.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold text-muted-foreground">Birlik</span>
          <Input
            value={manualFood.unit}
            onChange={(event) => onManualFieldChange("unit", event.target.value)}
          />
        </label>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
      <Button type="button" variant="outline" size="icon" onClick={onReset} aria-label="Qayta skanerlash">
        <RefreshCcwIcon className="size-4" />
      </Button>
      <Button type="button" onClick={onAddManualFood}>
        <PlusIcon className="mr-2 size-4" />
        Qo'l bilan qo'shish
      </Button>
    </div>
  </div>
);

export default function CameraResultDrawer({
  ai,
  barcode,
  open,
  resultType,
  onOpenChange,
}) {
  const isAi = resultType === "ai";
  const isBarcode = resultType === "barcode";
  const title = isBarcode ? "Barcode natijasi" : "AI topgan ovqatlar";
  const description = isBarcode
    ? "Mahsulotni tekshiring yoki qo'l bilan kiriting."
    : "Ingredientlarni tekshiring va ovqatga qo'shing.";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent
        size="sm"
        className="data-[vaul-drawer-direction=bottom]:max-h-[86vh] data-[vaul-drawer-direction=bottom]:h-auto"
      >
        <DrawerHeader className="relative shrink-0 border-b border-border/40 px-5 pb-3 pt-5 text-left">
          <div className="pr-10">
            <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {description}
            </DrawerDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"
            aria-label="Natijani yopish"
          >
            <XIcon className="size-4" />
          </button>
        </DrawerHeader>

        <DrawerBody className="max-h-[calc(86vh-10rem)] overflow-y-auto px-5 py-4">
          {isAi && ai.status === "analyzing" ? (
            <AiAnalyzingContent imageUrl={ai.imageUrl} />
          ) : null}
          {isAi && ai.status === "empty" ? (
            <AiEmptyContent
              imageUrl={ai.imageUrl}
              scanError={ai.scanError}
              onRetake={ai.onRetake}
            />
          ) : null}
          {isAi && ai.status === "ready" ? (
            <AiReadyContent {...ai} />
          ) : null}
          {isAi && ai.status === "error" ? (
            <AiEmptyContent
              imageUrl={ai.imageUrl}
              scanError={ai.scanError}
              onRetake={ai.onRetake}
            />
          ) : null}

          {isBarcode && barcode.status === "loading" ? (
            <BarcodeLoadingContent scannedCode={barcode.scannedCode} />
          ) : null}
          {isBarcode && barcode.status === "found" && barcode.foundFood && barcode.foundMacros ? (
            <BarcodeFoundContent {...barcode} />
          ) : null}
          {isBarcode && barcode.status === "not-found" ? (
            <BarcodeManualContent {...barcode} />
          ) : null}
          {isBarcode && barcode.status === "error" ? (
            <BarcodeManualContent
              {...barcode}
              title="Barcode tekshirishda xatolik bo'ldi"
            />
          ) : null}
        </DrawerBody>

        {isAi && ai.status === "ready" && ai.items.length > 0 ? (
          <DrawerFooter>
            <div className="grid w-full gap-3">
              <Button type="button" variant="outline" onClick={ai.onRetake}>
                Qayta olish
              </Button>
              <Button type="button" onClick={ai.onSave} disabled={ai.isSaving}>
                {ai.isSaving ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Saqlanmoqda
                  </>
                ) : (
                  "Tasdiqlash va qo'shish"
                )}
              </Button>
            </div>
          </DrawerFooter>
        ) : null}
      </NutritionDrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Run tests to confirm no existing imports are broken**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/meal-draft-review.test.js --run
```

Expected: PASS. The new component is not imported yet, so this confirms no module-level syntax failure in shared nutrition helpers.

- [ ] **Step 3: Commit the extracted drawer component**

```bash
git add src/modules/user/containers/nutrition/camera-result-drawer.jsx
git commit -m "feat: add nutrition scan result drawer"
```

## Task 3: Compact Main Scanner Surface

**Files:**
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`

- [ ] **Step 1: Remove unused AI access text import**

In `camera-drawer.jsx`, remove this import:

```jsx
import { AiAccessStatusText } from "@/components/ai-access";
```

Keep the `useAiAccessStatus`, `getAiAccessStatus`, and `isAiAccessLimitError` imports because the capture flow still needs AI gating and errors.

- [ ] **Step 2: Add the compact preview test id and aspect ratio**

In `ScanCameraView`, replace the preview wrapper:

```jsx
<div
  className="relative w-full overflow-hidden rounded-2xl bg-black"
  style={{ aspectRatio: "3/4" }}
>
```

with:

```jsx
<div
  data-testid="nutrition-scan-preview"
  className="relative w-full max-h-[min(58vh,30rem)] overflow-hidden rounded-2xl bg-black"
  style={{ aspectRatio: "4 / 5" }}
>
```

- [ ] **Step 3: Remove the scanner header trial label**

In the scanner header JSX, delete this block:

```jsx
{scanMode === "camera" ? (
  <AiAccessStatusText
    access={aiAccess}
    className="justify-center"
  />
) : null}
```

Do not remove AI credit validation from `handleCapture`.

- [ ] **Step 4: Run the scanner shell test**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: PASS for the first scanner shell test, with later tests absent until the next task.

- [ ] **Step 5: Commit the compact scanner shell**

```bash
git add src/modules/user/containers/nutrition/camera-drawer.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx
git commit -m "fix: compact nutrition scanner shell"
```

## Task 4: Wire Barcode Results to the Nested Drawer

**Files:**
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`

- [ ] **Step 1: Add barcode nested drawer tests**

Append these tests inside `camera-drawer.test.jsx`.

```jsx
describe("CameraDrawer barcode result drawer", () => {
  it("opens barcode lookup in a nested drawer instead of inline scanner content", async () => {
    lookupFoodByBarcodeMock.mockResolvedValue({
      id: "food-1",
      name: "Protein yogurt",
      barcode: "5449000000996",
      defaultAmount: 100,
      unit: "g",
      step: 10,
      baseCal: 126,
      baseProtein: 12,
      baseCarbs: 8,
      baseFat: 4,
    });

    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByText("Mock barcode scanner"));

    expect(screen.getByText("Barcode natijasi")).toBeInTheDocument();
    expect(screen.getByText("Barcode tekshirilmoqda")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Protein yogurt")).toBeInTheDocument();
    });

    expect(screen.getByText("Topildi")).toBeInTheDocument();
    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
  });

  it("adds a found barcode food and closes the scanner", async () => {
    lookupFoodByBarcodeMock.mockResolvedValue({
      id: "food-1",
      name: "Protein yogurt",
      barcode: "5449000000996",
      defaultAmount: 100,
      unit: "g",
      step: 10,
      baseCal: 126,
      baseProtein: 12,
      baseCarbs: 8,
      baseFat: 4,
    });
    addMealMock.mockResolvedValue({});

    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByText("Mock barcode scanner"));

    await waitFor(() => {
      expect(screen.getByText("Protein yogurt")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() => {
      expect(addMealMock).toHaveBeenCalledWith(
        "2026-05-24",
        "breakfast",
        expect.objectContaining({
          name: "Protein yogurt",
          source: "barcode",
          grams: 100,
          cal: 126,
          protein: 12,
          carbs: 8,
          fat: 4,
        }),
      );
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("opens manual barcode entry in the nested drawer when lookup misses", async () => {
    lookupFoodByBarcodeMock.mockResolvedValue(null);
    addMealMock.mockResolvedValue({});

    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByText("Mock barcode scanner"));

    await waitFor(() => {
      expect(screen.getByText("Ovqatni qo'l bilan kiriting")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi"), {
      target: { value: "Manual kefir" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Qo'l bilan qo'shish" }));

    await waitFor(() => {
      expect(addMealMock).toHaveBeenCalledWith(
        "2026-05-24",
        "breakfast",
        expect.objectContaining({
          name: "Manual kefir",
          barcode: "5449000000996",
          source: "barcode-manual",
        }),
      );
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the barcode tests and verify they fail**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: FAIL because `Barcode natijasi` is not wired and barcode content still renders inline.

- [ ] **Step 3: Import the result drawer and add result state**

In `camera-drawer.jsx`, add:

```jsx
import CameraResultDrawer from "./camera-result-drawer.jsx";
```

Inside `CameraDrawer`, add state next to barcode state:

```jsx
const [resultDrawerOpen, setResultDrawerOpen] = useState(false);
const [resultType, setResultType] = useState(null);
const [aiResultStatus, setAiResultStatus] = useState("idle");
```

In the existing open reset effect, add:

```jsx
setResultDrawerOpen(false);
setResultType(null);
setAiResultStatus("idle");
```

In the closed effect, add:

```jsx
setResultDrawerOpen(false);
setResultType(null);
setAiResultStatus("idle");
```

- [ ] **Step 4: Add a result drawer close helper**

Inside `CameraDrawer`, add this callback near `resetBarcodeScanner`:

```jsx
const handleResultDrawerOpenChange = useCallback(
  (nextOpen) => {
    setResultDrawerOpen(nextOpen);
    if (nextOpen) return;

    if (resultType === "barcode") {
      resetBarcodeScanner();
      setScanMode("barcode");
    }

    if (resultType === "ai") {
      setAiResultStatus("idle");
    }

    setResultType(null);
  },
  [resetBarcodeScanner, resultType],
);
```

- [ ] **Step 5: Update barcode scan transition**

In `handleBarcodeScan`, after `setScannedBarcode(normalizedCode);`, add:

```jsx
setResultType("barcode");
setResultDrawerOpen(true);
```

Keep the existing `setBarcodeStatus("loading")`, lookup, found, not-found, and error logic.

- [ ] **Step 6: Remove inline BarcodeLookupPanel render**

Delete this block from the main `DrawerBody` camera render:

```jsx
{scanMode === "barcode" ? (
  <div className="mt-4">
    <BarcodeLookupPanel
      amount={barcodeAmount}
      foundFood={barcodeFood}
      foundMacros={barcodeMacros}
      isLookingUp={isBarcodeLookingUp}
      manualFood={barcodeManualFood}
      onAddFoundFood={handleAddBarcodeFood}
      onAddManualFood={handleAddManualBarcodeFood}
      onAmountChange={setBarcodeAmount}
      onManualFieldChange={handleBarcodeManualFieldChange}
      onReset={resetBarcodeScanner}
      scannedCode={scannedBarcode}
      status={barcodeStatus}
    />
  </div>
) : null}
```

- [ ] **Step 7: Render `CameraResultDrawer`**

Before `RecentMealsDrawer`, render:

```jsx
<CameraResultDrawer
  open={resultDrawerOpen}
  resultType={resultType}
  onOpenChange={handleResultDrawerOpenChange}
  ai={{
    status: aiResultStatus,
    imageUrl: capturedImage,
    scanError,
    goals,
    items: scannedItems,
    saveToMyMeals,
    onSaveToMyMealsChange: setSaveToMyMeals,
    onRetake: handleRetake,
    onIngredientUpdate: handleIngredientUpdate,
    onIngredientRemove: handleIngredientRemove,
    onIngredientAdd: handleIngredientAdd,
    onRemove: handleRemoveItem,
    onConfirm: handleConfirmItem,
    onSave: handleSave,
    isSaving: isSaving || isAnalyzingDraftImage || isUploadingCapture,
  }}
  barcode={{
    amount: barcodeAmount,
    foundFood: barcodeFood,
    foundMacros: barcodeMacros,
    isLookingUp: isBarcodeLookingUp,
    manualFood: barcodeManualFood,
    onAddFoundFood: handleAddBarcodeFood,
    onAddManualFood: handleAddManualBarcodeFood,
    onAmountChange: setBarcodeAmount,
    onManualFieldChange: handleBarcodeManualFieldChange,
    onReset: resetBarcodeScanner,
    scannedCode: scannedBarcode,
    status: barcodeStatus,
  }}
/>
```

Update the main drawer `onOpenChange` guard to keep the main scanner open when nested result drawer is open:

```jsx
if (nextOpen || isStackedChildOpen || recentMealsOpen || mealTimeOpen || resultDrawerOpen) {
  return;
}
```

- [ ] **Step 8: Remove old local barcode panel code**

Delete `BarcodeLookupPanel` and `barcodeMacroInputs` from `camera-drawer.jsx`. Delete `getSliderMax` from `camera-drawer.jsx` because the nested result drawer handles barcode amount limits. Keep `calcMacros` in `camera-drawer.jsx` because `barcodeMacros` is still computed there and passed into `CameraResultDrawer`.

- [ ] **Step 9: Run barcode tests**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: PASS for scanner shell and barcode tests.

- [ ] **Step 10: Commit barcode nested result flow**

```bash
git add src/modules/user/containers/nutrition/camera-drawer.jsx src/modules/user/containers/nutrition/camera-result-drawer.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx
git commit -m "feat: show barcode results in nested drawer"
```

## Task 5: Wire AI Results to the Nested Drawer

**Files:**
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`

- [ ] **Step 1: Add AI nested drawer test**

Append this test to `camera-drawer.test.jsx`.

```jsx
describe("CameraDrawer AI result drawer", () => {
  it("opens AI analysis and review in the nested result drawer", async () => {
    uploadMealCaptureMock.mockResolvedValue("https://cdn.example.com/scan.jpg");
    analyzeMealImageDraftMock.mockResolvedValue({
      items: [
        {
          id: "draft-1",
          title: "Chicken rice",
          ingredients: [
            {
              id: "rice",
              name: "Rice",
              grams: 150,
              nutrition: {
                calories: 200,
                protein: 4,
                carbs: 44,
                fat: 0.4,
                fiber: 0.6,
              },
            },
          ],
        },
      ],
    });

    const view = renderDrawer();

    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("AI topgan ovqatlar")).toBeInTheDocument();
    expect(screen.getByText("AI tahlil qilmoqda")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Chicken rice")).toBeInTheDocument();
    });

    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the AI test and verify it fails**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: FAIL because AI still uses `view="analyzing"` and `view="result"` in the main drawer.

- [ ] **Step 3: Update AI capture transition**

In `handleCapture`, replace:

```jsx
setCapturedImage(dataUrl);
setScannedItems([]);
setScanError(null);
setView("analyzing");
```

with:

```jsx
setCapturedImage(dataUrl);
setScannedItems([]);
setScanError(null);
setResultType("ai");
setAiResultStatus("analyzing");
setResultDrawerOpen(true);
```

In the success branch, replace:

```jsx
setView("result");
```

with:

```jsx
setAiResultStatus(items.length === 0 ? "empty" : "ready");
```

In the error branch, replace:

```jsx
setView("result");
```

with:

```jsx
setAiResultStatus("error");
setResultType("ai");
setResultDrawerOpen(true);
```

- [ ] **Step 4: Keep scanner view stable and accessible**

In the capture button inside `ScanCameraView`, add:

```jsx
aria-label={scanMode === "barcode" ? "Barcode reset" : "Capture"}
```

Keep the existing `aria-disabled`.

- [ ] **Step 5: Update retake behavior**

In `handleRetake`, replace:

```jsx
setView("camera");
```

with:

```jsx
setAiResultStatus("idle");
setResultType(null);
setResultDrawerOpen(false);
setView("camera");
```

This keeps compatibility with existing `view` usage while closing the nested result drawer.

- [ ] **Step 6: Remove old main drawer analyzing/result rendering**

Delete the `view === "analyzing"` and `view === "result"` branches from the main `DrawerBody` `AnimatePresence`. The main body should only render the scanner when `view === "camera"`.

Then remove `isNoFoodView` and `showHeader` logic tied to `view === "result"`:

```jsx
const isNoFoodView = view === "result" && scannedItems.length === 0;
const showHeader = view !== "analyzing" && !isNoFoodView;
```

Replace with:

```jsx
const showHeader = true;
```

Delete the local `AnalyzeView`, `NoFoodView`, and `ResultView` definitions from `camera-drawer.jsx`; the nested result drawer now owns those states.

- [ ] **Step 7: Run AI tests**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: PASS for scanner, barcode, and AI tests.

- [ ] **Step 8: Commit AI nested result flow**

```bash
git add src/modules/user/containers/nutrition/camera-drawer.jsx src/modules/user/containers/nutrition/camera-result-drawer.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx
git commit -m "feat: show AI scan results in nested drawer"
```

## Task 6: Validate Barcode and AI Edge States

**Files:**
- Modify: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/camera-result-drawer.jsx`

- [ ] **Step 1: Add close-to-scanner and blocked-access tests**

Append these tests.

```jsx
describe("CameraDrawer result drawer recovery", () => {
  it("closing barcode result drawer returns to barcode scanner", async () => {
    lookupFoodByBarcodeMock.mockResolvedValue(null);

    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByText("Mock barcode scanner"));

    await waitFor(() => {
      expect(screen.getByText("Ovqatni qo'l bilan kiriting")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Natijani yopish" }));

    expect(screen.queryByText("Ovqatni qo'l bilan kiriting")).not.toBeInTheDocument();
    expect(screen.getByText("Mock barcode scanner")).toBeInTheDocument();
    expect(screen.getByText("Barcode skanerlash")).toBeInTheDocument();
  });

  it("blocks AI upload with an actionable error when photo scan access is disabled", () => {
    aiAccessDisabled = true;

    const view = renderDrawer();

    fireEvent.change(view.container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(uploadMealCaptureMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Bugungi AI limitingiz tugagan. Premium orqali cheksiz AI ishlatishingiz mumkin.",
    );
    expect(screen.queryByText("AI topgan ovqatlar")).not.toBeInTheDocument();
    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run recovery test and fix any broken close behavior**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: PASS. If it fails because `onOpenChange(false)` closes the parent drawer, confirm the parent `Drawer` guard includes `resultDrawerOpen` and that nested drawer close only calls `setResultDrawerOpen(false)`.

- [ ] **Step 3: Ensure barcode reset reopens scanner**

Update the `barcode` prop passed to `CameraResultDrawer` so reset closes the nested drawer and returns to the scanner:

```jsx
onReset: () => {
  resetBarcodeScanner();
  setResultDrawerOpen(false);
  setResultType(null);
  setScanMode("barcode");
},
```

Keep `resetBarcodeScanner` unchanged for mode switches.

- [ ] **Step 4: Ensure successful add closes all scanner UI**

After `handleAddBarcodeFood`, `handleAddManualBarcodeFood`, and `handleSave` call `onClose()`, also clear result state before closing:

```jsx
setResultDrawerOpen(false);
setResultType(null);
setAiResultStatus("idle");
onClose();
```

Apply this pattern in each success path so the next open starts clean.

- [ ] **Step 5: Run full camera drawer tests**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run
```

Expected: PASS.

- [ ] **Step 6: Commit edge-state fixes**

```bash
git add src/modules/user/containers/nutrition/camera-drawer.jsx src/modules/user/containers/nutrition/camera-result-drawer.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx
git commit -m "fix: reset nutrition scanner result states"
```

## Task 7: Final Verification

**Files:**
- Verify: `src/modules/user/containers/nutrition/camera-drawer.jsx`
- Verify: `src/modules/user/containers/nutrition/camera-result-drawer.jsx`
- Verify: `src/modules/user/containers/nutrition/camera-drawer.test.jsx`
- Verify: `docs/superpowers/specs/2026-05-24-nutrition-scan-result-drawer-design.md`

- [ ] **Step 1: Run targeted nutrition tests**

Run:

```bash
npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx src/modules/user/containers/nutrition/smart-add-sheet.test.jsx src/modules/user/containers/nutrition/meal-draft-review.test.js --run
```

Expected: all listed test files pass.

- [ ] **Step 2: Run frontend build**

Run:

```bash
npm run build
```

Expected: build exits with code 0. Existing Vite large chunk and MapLibre tolerated-transform warnings may appear; they are not failures.

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git diff --stat
git diff -- src/modules/user/containers/nutrition/camera-drawer.jsx src/modules/user/containers/nutrition/camera-result-drawer.jsx src/modules/user/containers/nutrition/camera-drawer.test.jsx
```

Expected:

- No unrelated files changed by this implementation.
- `AiAccessStatusText` is not rendered in `camera-drawer.jsx`.
- `nutrition-scan-preview` uses `aspectRatio: "4 / 5"`.
- Barcode result content is only in `camera-result-drawer.jsx`.
- AI result content is only in `camera-result-drawer.jsx`.

- [ ] **Step 4: Record verification result**

Add the exact targeted test command and build command output summaries to the final handoff response. Do not create an empty commit after verification.

## Self-Review Against Spec

- Trial label hidden: Task 3 removes `AiAccessStatusText` rendering and Task 1 tests it.
- Compact preview: Task 3 changes preview to `4 / 5` and Task 1 tests it.
- AI/Barcode visual parity: Task 3 keeps the shared scanner shell and Task 4 removes inline barcode results.
- Nested AI result drawer: Task 5 wires AI analyzing and result review into `CameraResultDrawer`.
- Nested Barcode result drawer: Task 4 wires loading/found/not-found/error into `CameraResultDrawer`.
- Existing backend/API contracts preserved: all tasks keep existing hooks and endpoints.
- Manual barcode fallback preserved: Task 4 and Task 6 keep manual add.
- Testing and build verification covered: Task 7 runs targeted tests and build.
