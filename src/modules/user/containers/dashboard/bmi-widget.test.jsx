import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import BmiWidget from "./bmi-widget.jsx";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(() => ({ data: null })),
}));

const renderWidget = (props = {}) =>
  render(
    <MemoryRouter>
      <BmiWidget interactive={false} {...props} />
    </MemoryRouter>,
  );

describe("BmiWidget", () => {
  it("renders BMI metrics inside the standard dashboard card shell", () => {
    renderWidget({
      measurementSnapshot: {
        currentWeight: 84,
        heightCm: 170,
        bmi: 29.065743944636683,
      },
    });

    expect(
      screen.getByText("BMI indeks").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("29.1")).toBeInTheDocument();
    expect(screen.getAllByText("Ortiqcha")).toHaveLength(2);
    expect(screen.getByText("BMI diapazon")).toBeInTheDocument();
  });

  it("keeps the empty state inside the standard card shell", () => {
    renderWidget({
      measurementSnapshot: {
        currentWeight: 0,
        heightCm: 0,
        bmi: null,
      },
    });

    expect(
      screen.getByText("BMI indeks").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ma'lumot yo'q")).toBeInTheDocument();
  });
});
