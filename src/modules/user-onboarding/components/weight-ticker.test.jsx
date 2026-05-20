import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeightTicker } from "./weight-ticker.jsx";

vi.mock("motion/react", async () => {
  return {
    motion: {
      span: ({ children, ...props }) => (
        <span {...props}>
          {typeof children?.get === "function" ? children.get() : children}
        </span>
      ),
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    },
    useMotionValue: (initial) => ({
      get: () => initial,
      set: vi.fn(),
    }),
    useReducedMotion: () => true,
    useSpring: (value) => value,
    useTransform: (_value, transform) => ({
      get: () => transform(0),
    }),
  };
});

describe("WeightTicker", () => {
  it("does not render the min and max helper text under the ticker", () => {
    render(
      <WeightTicker
        ariaLabel="Target weight"
        max={120}
        min={40}
        onChange={vi.fn()}
        unit="kg"
        value="72"
      />,
    );

    expect(screen.queryByText("40-120 kg")).not.toBeInTheDocument();
  });

  it("exposes min and max through slider aria values", () => {
    render(
      <WeightTicker
        ariaLabel="Target weight"
        max={120}
        min={40}
        onChange={vi.fn()}
        unit="kg"
        value="72"
      />,
    );

    expect(
      screen.getByRole("slider", { name: "Target weight" }),
    ).toHaveAttribute("aria-valuemin", "40");
    expect(
      screen.getByRole("slider", { name: "Target weight" }),
    ).toHaveAttribute("aria-valuemax", "120");
  });

  it("keeps the vertical pointer on the same row as the active ticker value", () => {
    render(
      <WeightTicker
        ariaLabel="Age"
        max={120}
        min={13}
        onChange={vi.fn()}
        orientation="vertical"
        unit="yosh"
        value="28"
      />,
    );

    expect(screen.getByTestId("ticker-center-pointer")).toHaveStyle({
      height: "12px",
      top: "calc(50% - 6px)",
    });
    expect(screen.getByRole("slider", { name: "Age" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowUp ArrowDown ArrowLeft ArrowRight PageUp PageDown Home End",
    );
  });
});
