import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import WorkoutShell from "./workout-shell.jsx";

const renderShell = (initialEntry) => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/user/workout/*" element={<WorkoutShell />}>
          <Route path="home" element={<div>Workout Home</div>} />
          <Route path="plans" element={<div>Workout Plans</div>} />
          <Route
            path="plans/:planId/days/:dayIndex/session"
            element={<div>Workout Session</div>}
          />
          <Route path="report" element={<div>Workout Report</div>} />
          <Route path="exercises" element={<div>Workout Exercises</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
};

describe("WorkoutShell", () => {
  it("shows top tabs on workout home", () => {
    renderShell("/user/workout/home");

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plans").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exercises").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Workout Home")).toBeInTheDocument();
  });

  it("hides top tabs on deep workout session route", () => {
    renderShell("/user/workout/plans/plan-1/days/0/session");

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getByText("Workout Session")).toBeInTheDocument();
  });
});
