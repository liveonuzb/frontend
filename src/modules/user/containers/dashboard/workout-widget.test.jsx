import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutWidget from "./workout-widget.jsx";
import useGetQuery from "@/hooks/api/use-get-query";
import { useRunningStatsSummary } from "@/hooks/app/use-running-sessions";

vi.mock("@/hooks/api/use-get-query", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/app/use-running-sessions", () => ({
  useRunningStatsSummary: vi.fn(),
}));

const renderWidget = (props = {}) =>
  render(
    <MemoryRouter>
      <WorkoutWidget activePlan={null} {...props} />
    </MemoryRouter>,
  );

describe("WorkoutWidget", () => {
  beforeEach(() => {
    useGetQuery.mockReturnValue({ data: null });
    useRunningStatsSummary.mockReturnValue({
      stats: {
        totalRuns: 3,
        totalDistanceMeters: 12400,
        totalDurationSeconds: 3600,
        totalCaloriesBurned: 720,
      },
    });
  });

  it("shows a running summary link when running stats exist", () => {
    renderWidget();

    expect(screen.getByText("12.4 km")).toBeInTheDocument();
    expect(screen.getByText("3 runs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Running/i })).toHaveAttribute(
      "href",
      "/user/workout/running",
    );
  });
});
