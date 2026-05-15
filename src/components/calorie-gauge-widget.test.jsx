import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";

describe("CalorieGaugeWidget", () => {
  it("renders the SVG gauge without hiding it on mobile breakpoints", () => {
    render(
      <CalorieGaugeWidget
        consumed={900}
        goal={2200}
        labels={{ ariaLabel: "Bugungi calorie gauge" }}
      />,
    );

    const gauge = screen.getByRole("img", { name: "Bugungi calorie gauge" });

    expect(gauge.tagName.toLowerCase()).toBe("svg");
    expect(gauge.parentElement).not.toHaveClass("hidden");
  });
});
