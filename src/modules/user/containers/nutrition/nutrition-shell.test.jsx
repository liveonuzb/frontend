import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NutritionShell from "./nutrition-shell.jsx";
import NutritionRoutes from "./routes.jsx";

vi.mock("./home/index.jsx", () => ({
  default: () => <div>Nutrition Overview Page</div>,
}));

vi.mock("./plans/index.jsx", () => ({
  default: () => <div>Nutrition Plans Page</div>,
}));

vi.mock("./history/index.jsx", () => ({
  default: () => <div>Nutrition History Page</div>,
}));

vi.mock("./report/index.jsx", () => ({
  default: () => <div>Nutrition Report Page</div>,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="nutrition-location">{location.pathname}</div>;
};

describe("NutritionShell", () => {
  it("shows top tabs on nutrition overview", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/overview"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plans").length).toBeGreaterThan(0);
    expect(screen.queryByText("Meals")).not.toBeInTheDocument();
    expect(screen.getAllByText("History").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Nutrition Overview")).toBeInTheDocument();
  });

  it("hides top tabs on deep nutrition route", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/plans/plan-1"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="plans/:planId" element={<div>Nutrition Plan Detail</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getByText("Nutrition Plan Detail")).toBeInTheDocument();
  });

  it("does not treat the removed nutrition home path as a primary tab", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/home"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Nutrition Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("redirects the nutrition index to overview", async () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition"]}>
        <Routes>
          <Route
            path="/user/nutrition/*"
            element={
              <>
                <NutritionRoutes />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("nutrition-location")).toHaveTextContent(
        "/user/nutrition/overview",
      );
    });
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
  });
});
