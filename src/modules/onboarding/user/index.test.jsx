import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import UserOnboardingModule from "./index.jsx";

vi.mock("@/modules/onboarding/layout/index.jsx", async () => {
  const { Outlet } = await vi.importActual("react-router");
  return {
    default: () => (
      <div>
        <span>layout</span>
        <Outlet />
      </div>
    ),
  };
});

vi.mock("@/modules/onboarding/user/pages/entry/index.jsx", () => ({
  default: () => <div>entry-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/name/index.jsx", () => ({
  default: () => <div>name-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/gender/index.jsx", () => ({
  default: () => <div>gender-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/age/index.jsx", () => ({
  default: () => <div>age-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/height/index.jsx", () => ({
  default: () => <div>height-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/current-weight/index.jsx", () => ({
  default: () => <div>current-weight-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/goal/index.jsx", () => ({
  default: () => <div>goal-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/target-weight/index.jsx", () => ({
  default: () => <div>target-weight-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/weekly-pace/index.jsx", () => ({
  default: () => <div>weekly-pace-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/other-goals/index.jsx", () => ({
  default: () => <div>other-goals-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/activity-level/index.jsx", () => ({
  default: () => <div>activity-level-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/meal-frequency/index.jsx", () => ({
  default: () => <div>meal-frequency-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/allergies/index.jsx", () => ({
  default: () => <div>allergies-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/diet-requirements/index.jsx", () => ({
  default: () => <div>diet-requirements-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/health-constraints/index.jsx", () => ({
  default: () => <div>health-constraints-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/review/index.jsx", () => ({
  default: () => <div>review-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/report/index.jsx", () => ({
  default: () => <div>report-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/personalizing/index.jsx", () => ({
  default: () => <div>personalizing-page</div>,
}));
vi.mock("@/modules/onboarding/user/pages/result/index.jsx", () => ({
  default: () => <div>metabolism-result-page</div>,
}));

describe("UserOnboardingModule routes", () => {
  it("renders active onboarding steps without invalid custom children under Routes", () => {
    render(
      <MemoryRouter initialEntries={["/name"]}>
        <UserOnboardingModule />
      </MemoryRouter>,
    );

    expect(screen.getByText("layout")).toBeInTheDocument();
    expect(screen.getByText("name-page")).toBeInTheDocument();
  });
});
