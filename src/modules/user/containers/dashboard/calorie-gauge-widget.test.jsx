import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import useGetQuery from "@/hooks/api/use-get-query";

vi.mock("@/hooks/api/use-get-query", () => ({
  default: vi.fn(() => ({ data: null })),
}));

describe("Dashboard CalorieGaugeWidget", () => {
  it("fills the width of its dashboard grid cell", () => {
    render(
      <MemoryRouter>
        <CalorieGaugeWidget
          dateKey="2026-05-14"
          dayData={{ meals: {} }}
          goalsState={{
            goals: { calories: 2200, protein: 150, carbs: 250, fat: 70 },
            goalSource: "fallback",
            hasServerGoals: false,
          }}
          user={null}
        />
      </MemoryRouter>,
    );

    expect(useGetQuery).toHaveBeenCalled();
    expect(screen.getByText("Bugungi Kaloriya").closest("[data-slot=card]"))
      .toHaveClass("w-full");
  });

  it("uses compact dashboard spacing to keep the top row shorter", () => {
    render(
      <MemoryRouter>
        <CalorieGaugeWidget
          dateKey="2026-05-14"
          dayData={{ meals: {} }}
          goalsState={{
            goals: { calories: 2200, protein: 150, carbs: 250, fat: 70 },
            goalSource: "fallback",
            hasServerGoals: false,
          }}
          user={null}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Bugungi Kaloriya").closest("[data-slot=card]"))
      .toHaveClass("py-4");
  });
});
