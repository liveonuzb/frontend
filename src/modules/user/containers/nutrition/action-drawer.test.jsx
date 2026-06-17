import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActionDrawer from "./action-drawer.jsx";

const mocks = vi.hoisted(() => ({
  audioProps: null,
  cameraProps: null,
  textProps: null,
  aiDraftProps: null,
  saveHistoryItem: vi.fn(),
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
    saveHistoryItem: mocks.saveHistoryItem,
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
  default: (props) => {
    mocks.audioProps = props;

    return (
      <button
        type="button"
        onClick={() =>
          props.onSubmitted?.({
            type: "meal",
            originalText: "2 ta tuxum va qatiq",
          })
        }
      >
        Mock audio submitted
      </button>
    );
  },
}));

vi.mock("./audio-transcript-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./text-add-drawer.jsx", () => ({
  default: (props) => {
    mocks.textProps = props;

    return (
      <div>
        <input
          aria-label="Mock text input"
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
        <button type="button" onClick={props.onContinue}>
          Mock text continue
        </button>
      </div>
    );
  },
}));

vi.mock("./manual-add-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("./ai-meal-draft-drawer.jsx", () => ({
  default: (props) => {
    mocks.aiDraftProps = props;

    return <div>Mock AI draft review: {props.initialText}</div>;
  },
}));

beforeEach(() => {
  mocks.audioProps = null;
  mocks.cameraProps = null;
  mocks.textProps = null;
  mocks.aiDraftProps = null;
  mocks.saveHistoryItem.mockReset().mockResolvedValue({});
});

describe("ActionDrawer camera scan flow", () => {
  it("opens camera drawer in barcode mode from initial nested state", () => {
    render(
      <ActionDrawer
        open
        onOpenChange={vi.fn()}
        dateKey="2026-05-24"
        mealType="breakfast"
        initialNested="barcode"
        onOpenSavedMeals={vi.fn()}
        onCloseAll={vi.fn()}
      />,
    );

    expect(mocks.cameraProps).toEqual(
      expect.objectContaining({
        initialMode: "barcode",
        open: true,
      }),
    );
  });

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

  it("routes text add through AI draft review instead of direct meal logging", async () => {
    const onCloseAll = vi.fn();

    render(
      <ActionDrawer
        open
        onOpenChange={vi.fn()}
        dateKey="2026-05-24"
        mealType="lunch"
        onOpenSavedMeals={vi.fn()}
        onCloseAll={onCloseAll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Matn" }));
    fireEvent.change(screen.getByLabelText("Mock text input"), {
      target: { value: "2 ta tuxum va non" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mock text continue" }));

    await waitFor(() => {
      expect(screen.getByText(/Mock AI draft review:/i)).toHaveTextContent(
        "2 ta tuxum va non",
      );
    });
    expect(mocks.aiDraftProps).toEqual(
      expect.objectContaining({
        initialText: "2 ta tuxum va non",
        inputSource: "text",
        mealType: "lunch",
        targetDateKey: "2026-05-24",
      }),
    );
    expect(onCloseAll).not.toHaveBeenCalled();
  });

  it("saves audio transcript history only after audio submit is confirmed", async () => {
    const onCloseAll = vi.fn();

    render(
      <ActionDrawer
        open
        onOpenChange={vi.fn()}
        dateKey="2026-05-24"
        mealType="dinner"
        onOpenSavedMeals={vi.fn()}
        onCloseAll={onCloseAll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Audio" }));

    expect(mocks.saveHistoryItem).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Mock audio submitted" }),
    );

    await waitFor(() => {
      expect(mocks.saveHistoryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          transcript: "2 ta tuxum va qatiq",
          mealType: "dinner",
        }),
      );
    });
    expect(onCloseAll).toHaveBeenCalledTimes(1);
  });
});
