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
    DrawerBody: MockSlot("drawer-body"),
    DrawerContent: MockSlot("drawer-content"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
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
