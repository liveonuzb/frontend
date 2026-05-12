import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanPreviewPage from "./index.jsx";

const getQueryResultMock = vi.hoisted(() => vi.fn());
const postQueryResultMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const setOnboardingFlowMock = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) =>
      values?.defaultValue
        ? values.defaultValue
        : values?.count !== undefined
          ? `${key}:${values.count}`
          : key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => getQueryResultMock(...args),
  usePostQuery: (...args) => postQueryResultMock(...args),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({ setOnboardingFlow: setOnboardingFlowMock }),
}));

vi.mock("@/modules/onboarding/lib/onboarding-footer-context", () => ({
  useOnboardingFooter: vi.fn(),
}));

const preflight = {
  canGenerate: true,
  qualityScore: 84,
  readinessScore: 84,
  scoreType: "readiness",
  blockingIssues: [],
  warnings: [],
  recommendedFixes: [],
  nutrition: {
    dailyCalories: 2200,
    proteinGram: 150,
    carbsGram: 240,
    fatGram: 70,
    mealsPerDay: 3,
    preferredCuisineCount: 2,
    allergyCount: 0,
    budgetTier: null,
  },
  workout: {
    weeklyWorkoutDays: 4,
    workoutLocation: "home",
    equipmentCount: 3,
    bodyPartCount: 2,
  },
};

describe("PlanPreviewPage", () => {
  beforeEach(() => {
    getQueryResultMock.mockReset();
    postQueryResultMock.mockReset();
    navigateMock.mockReset();
    setOnboardingFlowMock.mockReset();
    getQueryResultMock.mockReturnValue({
      isLoading: false,
      data: { data: { data: preflight } },
    });
    postQueryResultMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders plan preview copy through onboarding locale keys", () => {
    render(<PlanPreviewPage />);

    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.badge"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.readinessScore"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.ready"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.nutritionTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.workoutTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.recommendationsTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.postOnboarding.planPreview.rows.calories"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kaloriya")).not.toBeInTheDocument();
    expect(screen.queryByText("AI rejani boshlash")).not.toBeInTheDocument();
  });
});
