import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AnimatedWaterWidget from "./animated-water-widget.jsx";

vi.mock("framer-motion", async () => {
  const React = await import("react");

  const MotionDiv = React.forwardRef(function MotionDiv(
    { animate, children, initial, transition, ...props },
    ref,
  ) {
    const animatedStyle =
      animate && typeof animate === "object" ? animate : {};

    return (
      <div ref={ref} {...props} style={{ ...props.style, ...animatedStyle }}>
        {children}
      </div>
    );
  });

  return {
    motion: {
      div: MotionDiv,
    },
    useReducedMotion: () => true,
  };
});

vi.mock("@/modules/user/containers/water/quick-cup-drawer", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("AnimatedWaterWidget", () => {
  it("renders themed progress without a card shell or double-applied width", () => {
    render(<AnimatedWaterWidget currentMl={500} maxMl={2000} />);

    const widget = screen.getByText("Suv ichish").closest(".water-widget");

    expect(widget.closest("[data-slot=card]")).toBeNull();

    const progressbar = screen.getByRole("progressbar", {
      name: "Suv progressi",
    });
    expect(progressbar).toHaveAttribute("aria-valuenow", "25");

    const progressWidths = widget.querySelectorAll('[style*="width: 25%"]');
    expect(progressWidths).toHaveLength(1);
    expect(progressWidths[0]).toHaveAttribute(
      "data-water-progress-fill",
      "true",
    );
  });
});
