import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import { useGetQuery } from "@/hooks/api";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(() => ({ data: null })),
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
    expect(
      screen.getByText("Bugungi Kaloriya").closest("[data-slot=card]"),
    ).toHaveClass("w-full");
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

    expect(
      screen.getByText("Bugungi Kaloriya").closest("[data-slot=card]"),
    ).toHaveClass("py-4");
  });

  it("passes burned calories from daily tracking into the summary", () => {
    render(
      <MemoryRouter>
        <CalorieGaugeWidget
          dateKey="2026-05-14"
          dayData={{ meals: {}, burnedCalories: 875 }}
          goalsState={{
            goals: { calories: 2400, protein: 150, carbs: 250, fat: 70 },
            goalSource: "fallback",
            hasServerGoals: false,
          }}
          user={null}
        />
      </MemoryRouter>,
    );

    const chartCard = screen
      .getByText("Bugungi Kaloriya")
      .closest("[data-slot=card]");

    expect(chartCard).toHaveTextContent("Yondirilgan");
    expect(chartCard).toHaveTextContent("875 kcal");
    expect(chartCard).toHaveTextContent("Maqsad");
    expect(chartCard).toHaveTextContent("2,400 kcal");
  });

  it("splits macros into separate cards and removes the mobile eaten summary", () => {
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

    const chartCard = screen
      .getByText("Bugungi Kaloriya")
      .closest("[data-slot=card]");

    expect(screen.queryByText("Yeyilgan")).not.toBeInTheDocument();
    expect(screen.getByText("Uglevod").closest("[data-slot=card]")).not.toBe(
      chartCard,
    );
    expect(screen.getByText("Oqsil").closest("[data-slot=card]")).not.toBe(
      chartCard,
    );
    expect(screen.getByText("Yog'").closest("[data-slot=card]")).not.toBe(
      chartCard,
    );
  });

  it("does not show goal warning badges inside the dashboard chart card", () => {
    render(
      <MemoryRouter>
        <CalorieGaugeWidget
          dateKey="2026-05-14"
          dayData={{
            meals: {
              breakfast: [{ cal: 900, protein: 5, carbs: 10, fat: 120 }],
            },
          }}
          goalsState={{
            goals: { calories: 2200, protein: 150, carbs: 250, fat: 70 },
            goalSource: "fallback",
            hasServerGoals: false,
          }}
          user={null}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Yog' oshib ketdi")).not.toBeInTheDocument();
  });
});
