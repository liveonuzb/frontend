import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoodWidgetView } from "./mood-widget.jsx";

vi.mock("framer-motion", async () => {
  const stripMotionProps = (props) => {
    const domProps = { ...props };
    delete domProps.animate;
    delete domProps.initial;
    delete domProps.transition;
    delete domProps.whileHover;
    delete domProps.whileTap;
    return domProps;
  };
  const MotionDiv = ({ children, ...props }) => {
    return <div {...stripMotionProps(props)}>{children}</div>;
  };
  const MotionButton = ({ children, ...props }) => {
    return <button {...stripMotionProps(props)}>{children}</button>;
  };

  return {
    motion: {
      div: MotionDiv,
      button: MotionButton,
    },
    useReducedMotion: () => true,
  };
});

describe("MoodWidgetView", () => {
  it("uses the standard dashboard card shell", () => {
    render(
      <MoodWidgetView
        compact
        readOnly
        selectedMood="neutral"
        labels={{ title: "Kayfiyat" }}
      />,
    );

    expect(
      screen.getByText("Kayfiyat").closest("[data-slot=card]"),
    ).toHaveClass("py-4");
    expect(screen.getByText("Oddiy")).toBeInTheDocument();
    expect(screen.getByLabelText("Oddiy")).toHaveClass("rounded-2xl");
  });
});
