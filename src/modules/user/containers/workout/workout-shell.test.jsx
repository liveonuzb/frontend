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
          <Route path="history" element={<div>Workout History</div>} />
          <Route path="running" element={<div>Workout Running</div>} />
          <Route path="running/history" element={<div>Running History</div>} />
          <Route path="running/:workoutSessionId" element={<div>Running Detail</div>} />
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
    expect(screen.getAllByText("Running").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exercises").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Workout Home")).toBeInTheDocument();
  });

  it("shows top tabs on the running workout tab", () => {
    renderShell("/user/workout/running");

    expect(screen.getAllByText("Running").length).toBeGreaterThan(0);
    expect(screen.getByText("Workout Running")).toBeInTheDocument();
  });

  it("hides top tabs on deep workout session route", () => {
    renderShell("/user/workout/plans/plan-1/days/0/session");

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getByText("Workout Session")).toBeInTheDocument();
  });

  it("shows top tabs on primary history list route", () => {
    renderShell("/user/workout/history");

    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Workout History")).toBeInTheDocument();
  });

  it("shows top tabs on running history list route", () => {
    renderShell("/user/workout/running/history");

    expect(screen.getAllByText("Running").length).toBeGreaterThan(0);
    expect(screen.getByText("Running History")).toBeInTheDocument();
  });

  it("hides top tabs on running detail routes", () => {
    renderShell("/user/workout/running/workout-1");

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.getByText("Running Detail")).toBeInTheDocument();
  });
});
