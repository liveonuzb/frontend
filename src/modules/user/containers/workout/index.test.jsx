import React from "react";
import "@/lib/i18n";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import WorkoutIndex from "./index.jsx";

vi.mock("./list", () => ({
  default: () => <div>Workout Home Page</div>,
}));

vi.mock("./history", () => ({
  default: () => <div>Workout History Page</div>,
}));

vi.mock("./history/detail", () => ({
  default: () => <div>Workout History Detail Page</div>,
}));

vi.mock("./report", () => ({
  default: () => <div>Workout Report Page</div>,
}));

vi.mock("./plans", () => ({
  default: () => <div>Workout Plans Page</div>,
}));

vi.mock("./plans/detail", () => ({
  default: () => <div>Workout Plan Detail Page</div>,
}));

vi.mock("./plans/day-detail", () => ({
  default: () => <div>Workout Plan Day Page</div>,
}));

vi.mock("./plans/session", () => ({
  default: () => <div>Workout Plan Session Page</div>,
}));

vi.mock("./plans/session-summary", () => ({
  default: () => <div>Workout Plan Session Summary Page</div>,
}));

vi.mock("./plans/create", () => ({
  default: () => <div>Create Workout Plan Page</div>,
}));

vi.mock("./plans/edit", () => ({
  default: () => <div>Edit Workout Plan Page</div>,
}));

vi.mock("./logs/create", () => ({
  default: () => <div>Create Workout Log Page</div>,
}));

vi.mock("./logs/edit", () => ({
  default: () => <div>Edit Workout Log Page</div>,
}));

vi.mock("./exercises", () => ({
  default: () => <div>Workout Exercises Page</div>,
}));

vi.mock("./running", () => ({
  default: () => <div>Deprecated Running Page</div>,
}));

vi.mock("./running/live", () => ({
  default: () => <div>Running Live Page</div>,
}));

vi.mock("./running/history", () => ({
  default: () => <div>Deprecated Running History Page</div>,
}));

vi.mock("./running/detail", () => ({
  default: () => <div>Deprecated Running Detail Page</div>,
}));

const renderWorkoutRoute = (initialEntry) => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/user/workout/*" element={<WorkoutIndex />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("Workout routing", () => {
  it("redirects deprecated running landing route to Workout Home", async () => {
    renderWorkoutRoute("/user/workout/running");

    expect(await screen.findByText("Workout Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Deprecated Running Page")).not.toBeInTheDocument();
  });

  it("redirects deprecated running history route to unified Workout History", async () => {
    renderWorkoutRoute("/user/workout/running/history");

    expect(await screen.findByText("Workout History Page")).toBeInTheDocument();
    expect(screen.queryByText("Deprecated Running History Page")).not.toBeInTheDocument();
  });

  it("redirects deprecated running detail links to unified history detail", async () => {
    renderWorkoutRoute("/user/workout/running/session-1");

    expect(await screen.findByText("Workout History Detail Page")).toBeInTheDocument();
    expect(screen.queryByText("Deprecated Running Detail Page")).not.toBeInTheDocument();
  });

  it("preserves the hidden running live route for active GPS sessions", async () => {
    renderWorkoutRoute("/user/workout/running/live/session-1");

    expect(await screen.findByText("Running Live Page")).toBeInTheDocument();
  });

  it("renders the dedicated Workout Report page", async () => {
    renderWorkoutRoute("/user/workout/report");

    expect(await screen.findByText("Workout Report Page")).toBeInTheDocument();
    expect(screen.queryByText("Workout History Page")).not.toBeInTheDocument();
  });
});
