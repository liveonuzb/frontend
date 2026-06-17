import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";

import toLower from "lodash/toLower";

describe("CalorieGaugeWidget", () => {
  it("renders a food and burned calories summary inside the gauge card", () => {
    render(
      <CalorieGaugeWidget
        burnedCalories={875}
        consumed={900}
        goal={2400}
      />,
    );

    const chartCard = screen
      .getByText("Bugungi Kaloriya")
      .closest("[data-slot=card]");

    expect(chartCard).toHaveTextContent("Food");
    expect(chartCard).toHaveTextContent("900 kcal");
    expect(chartCard).toHaveTextContent("Yondirilgan");
    expect(chartCard).toHaveTextContent("875 kcal");
    expect(chartCard).not.toHaveTextContent("Maqsad");
  });

  it("renders the SVG gauge without hiding it on mobile breakpoints", () => {
    render(
      <CalorieGaugeWidget
        consumed={900}
        goal={2200}
        labels={{ ariaLabel: "Bugungi calorie gauge" }}
      />,
    );

    const gauge = screen.getByRole("img", { name: "Bugungi calorie gauge" });

    expect(toLower(gauge.tagName)).toBe("svg");
    expect(gauge.parentElement).not.toHaveClass("hidden");
  });
});
