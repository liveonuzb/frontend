import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import WorkoutShell from "./workout-shell.jsx";

const renderShell = (initialEntry) => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/user/workout/*" element={<WorkoutShell />}>
          <Route path="home" element={<div>Workout Home</div>} />
          <Route path="overview" element={<div>Workout Overview</div>} />
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
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows top tabs on workout overview", () => {
    renderShell("/user/workout/overview");

    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.getAllByText("Plans").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exercises").length).toBeGreaterThan(0);
    expect(screen.getAllByText("History").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.getByText("Workout Overview")).toBeInTheDocument();
  });

  it("exposes workout tabs as labelled navigation with the active page", () => {
    renderShell("/user/workout/plans");

    const navSurfaces = screen.getAllByRole("navigation", {
      name: "Workout module sections",
    });

    expect(navSurfaces.length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Plans" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Running" })).not.toBeInTheDocument();
  });

  it("hides top tabs on the deprecated running workout tab", () => {
    renderShell("/user/workout/running");

    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.getByText("Workout Running")).toBeInTheDocument();
  });

  it("hides top tabs on deep workout session route", () => {
    renderShell("/user/workout/plans/plan-1/days/0/session");

    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getByText("Workout Session")).toBeInTheDocument();
  });

  it("shows top tabs on primary history list route", () => {
    renderShell("/user/workout/history");

    expect(screen.getAllByText("History").length).toBeGreaterThan(0);
    expect(screen.getByText("Workout History")).toBeInTheDocument();
  });

  it("hides top tabs on deprecated running history routes", () => {
    renderShell("/user/workout/running/history");

    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.getByText("Running History")).toBeInTheDocument();
  });

  it("hides top tabs on running detail routes", () => {
    renderShell("/user/workout/running/workout-1");

    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.getByText("Running Detail")).toBeInTheDocument();
  });
});
