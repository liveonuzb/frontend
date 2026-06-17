import React from "react";
import {
  act,
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
    Drawer: ({ children, open, nested = false }) =>
      open ? (
        <div data-testid={nested ? "nested-drawer" : "root-drawer"}>
          {children}
        </div>
      ) : null,
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

  const result = render(
    <CameraDrawer
      dateKey="2026-05-24"
      mealType="breakfast"
      open
      onClose={onClose}
      onOpenText={vi.fn()}
      {...props}
    />,
  );

  return { ...result, onClose };
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

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
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

    expect(
      screen.getByRole("button", { name: "AI rejimiga qaytish" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));

    expect(screen.getByText("Shtrix-kod natijasi")).toBeInTheDocument();
    expect(screen.getByText("Shtrix-kod tekshirilmoqda")).toBeInTheDocument();
    expect(screen.getByText("Shtrix-kod skanerlash")).toBeInTheDocument();

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

  it("keeps manual barcode draft open when nutrition values are invalid", async () => {
    mocks.lookupFoodByBarcode.mockResolvedValue(null);
    const { onClose } = renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    await screen.findByText("Ovqatni qo'l bilan kiriting");
    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi"), {
      target: { value: "Manual snack" },
    });
    fireEvent.change(screen.getByLabelText("Kcal"), {
      target: { value: "-10" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Qo'l bilan qo'shish/i }),
    );

    expect(mocks.addMeal).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Kaloriya va makro qiymatlar 0 yoki undan katta bo'lishi kerak",
    );
    expect(screen.getByDisplayValue("Manual snack")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens manual barcode form after lookup miss and adds manual food", async () => {
    mocks.lookupFoodByBarcode.mockResolvedValue(null);
    const { onClose } = renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    expect(await screen.findByText("Topilmadi")).toBeInTheDocument();
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

  it("shows barcode lookup error and retries the same scanned code", async () => {
    mocks.lookupFoodByBarcode
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(foundFood);
    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));

    expect(await screen.findByText("Xatolik")).toBeInTheDocument();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Shtrix-kod bo'yicha ovqatni tekshirib bo'lmadi",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Shtrix-kodni qayta tekshirish" }),
    );

    expect(screen.getByText("Shtrix-kod tekshirilmoqda")).toBeInTheDocument();
    expect(await screen.findByText("Coca Cola")).toBeInTheDocument();
    expect(screen.getByText("Topildi")).toBeInTheDocument();
    expect(mocks.lookupFoodByBarcode).toHaveBeenCalledTimes(2);
    expect(mocks.lookupFoodByBarcode).toHaveBeenLastCalledWith("5449000000996");
  });

  it("opens AI gallery scan in nested drawer and renders draft result", async () => {
    const { onClose } = renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("AI topgan ovqatlar")).toBeInTheDocument();
    expect(screen.getByTestId("nested-drawer")).toBeInTheDocument();
    expect(screen.getByText("Rasm yuklanmoqda")).toBeInTheDocument();
    expect(await screen.findByText("Chicken rice")).toBeInTheDocument();
    expect(screen.getByText("Ovqatni aniqlash")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows separate AI upload and analysis states before draft ready", async () => {
    const upload = deferred();
    const analysis = deferred();
    mocks.uploadMealCapture.mockReturnValue(upload.promise);
    mocks.analyzeMealImageDraft.mockReturnValue(analysis.promise);
    renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("Rasm yuklanmoqda")).toBeInTheDocument();

    await act(async () => {
      upload.resolve("https://cdn.test/meal.jpg");
      await upload.promise;
    });

    expect(screen.getByText("AI tahlil qilmoqda")).toBeInTheDocument();

    await act(async () => {
      analysis.resolve({
        items: [
          {
            id: "draft-1",
            title: "Chicken rice",
            confidence: 0.91,
            reviewNeeded: false,
            ingredients: [],
          },
        ],
      });
      await analysis.promise;
    });

    expect(await screen.findByText("Chicken rice")).toBeInTheDocument();
  });

  it("shows low-confidence AI drafts as reviewable results", async () => {
    mocks.analyzeMealImageDraft.mockResolvedValueOnce({
      items: [
        {
          id: "draft-low",
          title: "Blurry soup",
          confidence: 0.52,
          reviewNeeded: true,
          ingredients: [],
        },
      ],
    });
    renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(await screen.findByText("Blurry soup")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Past ishonch ogohlantirishi" }),
    ).toHaveTextContent("Past ishonch");
    expect(screen.getByText("Save meal")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tasdiqlash va qo'shish" }),
    ).toBeInTheDocument();
  });

  it("shows no-food and AI error states for image scans", async () => {
    mocks.analyzeMealImageDraft.mockResolvedValueOnce({ items: [] });
    const first = renderDrawer();

    const firstInput = document.querySelector('input[type="file"]');
    fireEvent.change(firstInput, {
      target: {
        files: [new File(["meal"], "empty.jpg", { type: "image/jpeg" })],
      },
    });

    expect(await screen.findByText("Ovqat aniqlanmadi")).toBeInTheDocument();
    expect(
      screen.getByText("AI bu rasm uchun draft tayyorlay olmadi."),
    ).toBeInTheDocument();

    first.unmount();

    mocks.analyzeMealImageDraft.mockRejectedValueOnce({
      response: { data: { message: "AI servis ishlamadi" } },
    });
    renderDrawer();

    const secondInput = document.querySelector('input[type="file"]');
    fireEvent.change(secondInput, {
      target: {
        files: [new File(["meal"], "error.jpg", { type: "image/jpeg" })],
      },
    });

    expect(await screen.findByText("AI xatoligi")).toBeInTheDocument();
    expect(screen.getByText("AI servis ishlamadi")).toBeInTheDocument();
    expect(mocks.toastError).toHaveBeenCalledWith("AI servis ishlamadi");
  });

  it("closing barcode result drawer returns to scanner", async () => {
    const { onClose } = renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));
    await screen.findByText("Shtrix-kod natijasi");
    expect(screen.getByTestId("nested-drawer")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Natijani yopish" }),
    );

    expect(screen.queryByText("Shtrix-kod natijasi")).not.toBeInTheDocument();
    expect(screen.getByText("Shtrix-kod skanerlash")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores stale barcode lookup after closing result drawer", async () => {
    const lookup = deferred();
    mocks.lookupFoodByBarcode.mockReturnValue(lookup.promise);
    renderDrawer({ initialMode: "barcode" });

    fireEvent.click(screen.getByRole("button", { name: "Mock barcode scan" }));

    expect(screen.getByTestId("nutrition-scan-lock-line")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Natijani yopish" }),
    );

    expect(screen.queryByText("Shtrix-kod natijasi")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrition-scan-lock-line")).not.toBeInTheDocument();

    await act(async () => {
      lookup.resolve(foundFood);
      await lookup.promise;
    });

    expect(screen.queryByTestId("nutrition-scan-lock-line")).not.toBeInTheDocument();
    expect(screen.queryByText("Coca Cola")).not.toBeInTheDocument();
  });

  it("ignores stale AI analysis after closing result drawer", async () => {
    const upload = deferred();
    mocks.uploadMealCapture.mockReturnValue(upload.promise);
    renderDrawer();

    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [new File(["meal"], "meal.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByText("Rasm yuklanmoqda")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Natijani yopish" }),
    );

    expect(screen.queryByText("AI topgan ovqatlar")).not.toBeInTheDocument();

    await act(async () => {
      upload.resolve("https://cdn.test/stale-meal.jpg");
      await upload.promise;
    });

    expect(mocks.analyzeMealImageDraft).not.toHaveBeenCalled();
    expect(screen.queryByText("Chicken rice")).not.toBeInTheDocument();
    expect(screen.queryByText("AI topgan ovqatlar")).not.toBeInTheDocument();
  });

  it("shows disabled AI access feedback from visible photo controls before upload", async () => {
    mocks.aiAccessDisabled = true;
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Galereya" }));
    fireEvent.click(screen.getByRole("button", { name: "Rasmga olish" }));

    expect(mocks.uploadMealCapture).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledTimes(2);
    expect(mocks.toastError).toHaveBeenNthCalledWith(
      1,
      "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring.",
    );
    expect(mocks.toastError).toHaveBeenNthCalledWith(
      2,
      "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring.",
    );
  });
});
