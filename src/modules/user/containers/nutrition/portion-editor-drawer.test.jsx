import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PortionEditorDrawer from "./portion-editor-drawer.jsx";

vi.mock("@/components/ui/drawer.jsx", async () => {
  const ReactModule = await import("react");
  const MockSlot = (slot) => ({ children, ...props }) =>
    ReactModule.createElement("div", { ...props, "data-slot": slot }, children);

  return {
    Drawer: ({ children }) =>
      ReactModule.createElement("div", { "data-slot": "drawer" }, children),
    DrawerBody: MockSlot("drawer-body"),
    DrawerContent: MockSlot("drawer-content"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("@/components/ui/slider.jsx", async () => {
  const ReactModule = await import("react");

  return {
    Slider: ({ value, min, max, step, onValueChange }) =>
      ReactModule.createElement("input", {
        "data-testid": "portion-slider",
        type: "range",
        value: value?.[0] ?? min,
        min,
        max,
        step,
        onChange: (event) => onValueChange?.([Number(event.target.value)]),
      }),
  };
});

vi.mock("@/components/meal-plan-builder/gauge-progress.jsx", () => ({
  default: ({ label }) => <div>{label}</div>,
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: {
      protein: 150,
      carbs: 250,
      fat: 70,
    },
  }),
}));

describe("PortionEditorDrawer", () => {
  it("does not read portion fields when closed without a selected food", () => {
    expect(() =>
      render(
        <PortionEditorDrawer
          food={null}
          open={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />,
      ),
    ).not.toThrow();

    expect(screen.queryByText("Saqlash")).not.toBeInTheDocument();
  });
});
