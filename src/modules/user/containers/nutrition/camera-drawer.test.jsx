import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CameraDrawer from "./camera-drawer.jsx";

const mocks = vi.hoisted(() => ({
  addMeal: vi.fn(),
  lookupFoodByBarcode: vi.fn(),
  uploadMealCapture: vi.fn(),
  analyzeMealImageDraft: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  aiAccessDisabled: false,
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
    DrawerBody: MockSlot("drawer-body"),
    DrawerContent: MockSlot("drawer-content"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("@/components/ui/button.jsx", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min, max, step }) => (
    <input
      aria-label="Miqdori"
      type="range"
      value={value?.[0] ?? min}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
    />
  ),
}));

vi.mock("@/components/barcode-scanner", () => ({
  default: ({ onScan }) => (
    <button type="button" onClick={() => onScan("5449000000996")}>
      Mock barcode scan
    </button>
  ),
}));

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: ReactModule.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      h3: ReactModule.forwardRef(({ children, ...props }, ref) => (
        <h3 ref={ref} {...props}>
          {children}
        </h3>
      )),
    },
  };
});

vi.mock("@/hooks/app/use-food-catalog", () => ({
  useFoodBarcodeLookup: () => ({
    lookupFoodByBarcode: mocks.lookupFoodByBarcode,
    isLookingUp: false,
  }),
  useFoodScan: () => ({
    uploadMealCapture: mocks.uploadMealCapture,
    analyzeMealImageDraft: mocks.analyzeMealImageDraft,
    isAnalyzingDraftImage: false,
    isUploadingCapture: false,
  }),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: mocks.addMeal,
  }),
}));

vi.mock("@/hooks/app/use-saved-meals", () => ({
  useSavedMeals: () => ({
    items: [],
    isLoading: false,
  }),
  useSavedMealsActions: () => ({
    createSavedMeal: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: { calories: 2000 },
  }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  getAiAccessStatus: () => ({
    isDisabled: mocks.aiAccessDisabled,
  }),
  isAiAccessLimitError: () => false,
  useAiAccessStatus: () => ({
    access: mocks.aiAccessDisabled ? { allowed: false } : { allowed: true },
  }),
}));

vi.mock("@/components/ai-access", () => ({
  AiAccessStatusText: () => <span>7 kun trial</span>,
}));

vi.mock("@/store/language-store", () => ({
  default: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      user: {
        id: "user-1",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
    }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("./save-to-my-meals-button.jsx", () => ({
  default: ({ checked, onCheckedChange }) => (
    <label>
      Save meal
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  ),
}));

vi.mock("./recent-meals-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./meal-date-time-drawer.jsx", () => ({
  default: () => null,
}));

const renderDrawer = (props = {}) => {
  const onClose = vi.fn();

  render(
    <CameraDrawer
      dateKey="2026-05-24"
      mealType="breakfast"
      open
      onClose={onClose}
      onOpenText={vi.fn()}
      {...props}
    />,
  );

  return { onClose };
};

const foundFood = {
  id: "food-1",
  name: "Coca Cola",
  barcode: "5449000000996",
  cal: 42,
  protein: 0,
  carbs: 10,
  fat: 0,
  defaultAmount: 100,
  step: 10,
  unit: "g",
};

beforeEach(() => {
  mocks.aiAccessDisabled = false;
  mocks.addMeal.mockReset().mockResolvedValue({});
  mocks.lookupFoodByBarcode.mockReset().mockResolvedValue(foundFood);
  mocks.uploadMealCapture.mockReset().mockResolvedValue("https://cdn.test/meal.jpg");
  mocks.analyzeMealImageDraft.mockReset().mockResolvedValue({
    items: [
      {
        id: "draft-1",
        title: "Chicken rice",
        ingredients: [],
      },
    ],
  });
  mocks.toastError.mockReset();
  mocks.toastSuccess.mockReset();

  class MockFileReader {
    readAsDataURL() {
      this.result = "data:image/jpeg;base64,test";
      this.onload?.();
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);
});

describe("CameraDrawer nutrition scanner", () => {
  it("renders compact scanner shell without AI trial label", () => {
    renderDrawer();

    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
    expect(screen.queryByText("7 kun trial")).not.toBeInTheDocument();
    expect(screen.getByTestId("nutrition-scan-preview")).toHaveStyle({
      aspectRatio: "4 / 5",
    });
  });

  it("opens barcode lookup in a nested drawer and keeps scanner visible", async () => {
    let resolveLookup;
    mocks.lookupFoodByBarcode.mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      }),
    );
    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));

    expect(screen.getByText("Barcode natijasi")).toBeInTheDocument();
    expect(screen.getByText("Barcode tekshirilmoqda")).toBeInTheDocument();
    expect(screen.getByText("Barcode skanerlash")).toBeInTheDocument();

    resolveLookup(foundFood);

    expect(await screen.findByText("Coca Cola")).toBeInTheDocument();
    expect(screen.getByText("Topildi")).toBeInTheDocument();
  });

  it("adds found barcode food and closes the scan flow", async () => {
    const { onClose } = renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    await screen.findByText("Topildi");
    fireEvent.click(screen.getByRole("button", { name: /Qo'shish/i }));

    await waitFor(() => expect(mocks.addMeal).toHaveBeenCalledTimes(1));
    expect(mocks.addMeal).toHaveBeenCalledWith(
      "2026-05-24",
      "breakfast",
      expect.objectContaining({
        source: "barcode",
        grams: 100,
        cal: 42,
        protein: 0,
        carbs: 10,
        fat: 0,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens manual barcode form after lookup miss and adds manual food", async () => {
    mocks.lookupFoodByBarcode.mockResolvedValue(null);
    const { onClose } = renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    await screen.findByText("Ovqatni qo'l bilan kiriting");
    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi"), {
      target: { value: "Manual snack" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Qo'l bilan qo'shish/i }),
    );

    await waitFor(() => expect(mocks.addMeal).toHaveBeenCalledTimes(1));
    expect(mocks.addMeal).toHaveBeenCalledWith(
      "2026-05-24",
      "breakfast",
      expect.objectContaining({
        name: "Manual snack",
        source: "barcode-manual",
        barcode: "5449000000996",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens AI gallery scan in nested drawer and renders draft result", async () => {
    renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("AI topgan ovqatlar")).toBeInTheDocument();
    expect(screen.getByText("AI tahlil qilmoqda")).toBeInTheDocument();
    expect(await screen.findByText("Chicken rice")).toBeInTheDocument();
    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
  });

  it("closing barcode result drawer returns to scanner", async () => {
    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    await screen.findByText("Barcode natijasi");
    fireEvent.click(
      screen.getByRole("button", { name: "Natijani yopish" }),
    );

    expect(screen.queryByText("Barcode natijasi")).not.toBeInTheDocument();
    expect(screen.getByText("Barcode skanerlash")).toBeInTheDocument();
  });

  it("blocks disabled AI access before upload", async () => {
    mocks.aiAccessDisabled = true;
    renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(mocks.uploadMealCapture).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Bugungi AI limitingiz tugagan. Premium orqali cheksiz AI ishlatishingiz mumkin.",
    );
  });
});
