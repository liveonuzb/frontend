import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import WorkoutRoutes from "./index.jsx";

vi.mock("./workout-shell", async () => {
  const { Outlet } = await import("react-router");

  return {
    default: () => (
      <div data-testid="workout-shell">
        <Outlet />
      </div>
    ),
  };
});

vi.mock("./list", () => ({
  default: () => <div>Workout home route</div>,
}));
vi.mock("./history", () => ({
  default: () => <div>Workout history route</div>,
}));
vi.mock("./history/detail", () => ({
  default: () => <div>Workout history detail route</div>,
}));
vi.mock("./plans", () => ({
  default: () => <div>Workout plans route</div>,
}));
vi.mock("./plans/detail", () => ({
  default: () => <div>Workout plan detail route</div>,
}));
vi.mock("./plans/day-detail", () => ({
  default: () => <div>Workout plan day route</div>,
}));
vi.mock("./plans/session", () => ({
  default: () => <div>Workout plan session route</div>,
}));
vi.mock("./plans/session-summary", () => ({
  default: () => <div>Workout plan session summary route</div>,
}));
vi.mock("./plans/create", () => ({
  default: () => <div>Create workout plan route</div>,
}));
vi.mock("./plans/edit", () => ({
  default: () => <div>Edit workout plan route</div>,
}));
vi.mock("./logs/create", () => ({
  default: () => <div>Create workout log route</div>,
}));
vi.mock("./logs/edit", () => ({
  default: () => <div>Edit workout log route</div>,
}));
vi.mock("./exercises", () => ({
  default: () => <div>Workout exercises route</div>,
}));
vi.mock("./running", () => ({
  default: () => <div>Running route</div>,
}));
vi.mock("./running/live", () => ({
  default: () => <div>Running live route</div>,
}));
vi.mock("./running/history", () => ({
  default: () => <div>Running history route</div>,
}));
vi.mock("./running/detail", () => ({
  default: () => <div>Running detail route</div>,
}));

const renderRoutes = (initialEntry = "/user/workout") => {
  const router = createMemoryRouter(
    [
      {
        path: "/user/workout/*",
        element: <WorkoutRoutes />,
      },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe("WorkoutRoutes", () => {
  it("redirects the workout root to home", async () => {
    const router = renderRoutes();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/user/workout/home");
    });
    expect(screen.getByText("Workout home route")).toBeInTheDocument();
  });
});
