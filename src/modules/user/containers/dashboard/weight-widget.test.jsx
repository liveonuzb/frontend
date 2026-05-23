import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import WeightWidget from "./weight-widget.jsx";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(() => ({ data: null })),
}));

const renderWidget = (props = {}) =>
  render(
    <MemoryRouter>
      <WeightWidget interactive={false} {...props} />
    </MemoryRouter>,
  );

describe("WeightWidget", () => {
  it("renders weight progress inside the standard dashboard card shell", () => {
    renderWidget({
      measurementSnapshot: {
        currentWeight: 84,
        startWeight: 90,
        targetWeight: 80,
        weightChange: -2,
      },
    });

    expect(
      screen.getByText("Vazn").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("84.0")).toBeInTheDocument();
    expect(screen.getByText("Ko'krak / Bel / Son")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
