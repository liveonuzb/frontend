import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import NutritionShell from "./nutrition-shell.jsx";

describe("NutritionShell", () => {
  it("shows top tabs on nutrition home", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/home"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="home" element={<div>Nutrition Home</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plans").length).toBeGreaterThan(0);
    expect(screen.queryByText("Meals")).not.toBeInTheDocument();
    expect(screen.getAllByText("History").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Nutrition Home")).toBeInTheDocument();
  });

  it("hides top tabs on deep nutrition route", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/plans/plan-1"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="home" element={<div>Nutrition Home</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="plans/:planId" element={<div>Nutrition Plan Detail</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getByText("Nutrition Plan Detail")).toBeInTheDocument();
  });
});
