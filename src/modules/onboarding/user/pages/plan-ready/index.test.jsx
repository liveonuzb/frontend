import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import PlanReadyPage from ".";

const navigateMock = vi.hoisted(() => vi.fn());
const setOnboardingFlowMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const mutateAsyncMock = vi.hoisted(() => vi.fn());
const getQueryResultMock = vi.hoisted(() => vi.fn());

const translations = {
  "onboarding.postOnboarding.planReady.badge": "Plan ready",
  "onboarding.postOnboarding.planReady.title": "Your plan is ready",
  "onboarding.postOnboarding.planReady.subtitle":
    "Your meal and workout plans are generated.",
  "onboarding.postOnboarding.planReady.cta": "Start dashboard",
  "onboarding.postOnboarding.planReady.retentionTitle": "Keep it going",
  "onboarding.postOnboarding.planReady.retentionDescription":
    "Turn on reminders to keep logging water, meals, and workouts.",
  "onboarding.postOnboarding.planReady.qualityTitle": "Plan quality",
  "onboarding.postOnboarding.planReady.qualityScore": "Quality score",
  "onboarding.postOnboarding.planReady.qualityPassed": "Quality gate passed",
  "onboarding.postOnboarding.planReady.qualityLevel.excellent": "Excellent",
  "onboarding.postOnboarding.planReady.steps.water.title":
    "Start today's water",
  "onboarding.postOnboarding.planReady.steps.water.description":
    "Log the first 250 ml to start your streak.",
  "onboarding.postOnboarding.planReady.steps.meal.title":
    "Log the first meal",
  "onboarding.postOnboarding.planReady.steps.meal.description":
    "This connects tracking to your meal plan.",
  "onboarding.postOnboarding.planReady.steps.workout.title":
    "Choose workout time",
  "onboarding.postOnboarding.planReady.steps.workout.description":
    "Weekly plan stays easier with reminders.",
};

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => translations[key] ?? key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => getQueryResultMock(...args),
  usePostQuery: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      setOnboardingFlow: setOnboardingFlowMock,
      latestPlanGenerationJobId: "generation-1",
    }),
}));

const renderPlanReady = () =>
  render(
    <OnboardingFooterProvider>
      <PlanReadyPage />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("PlanReadyPage", () => {
  beforeEach(() => {
    getQueryResultMock.mockReset();
    getQueryResultMock.mockReturnValue({
      data: {
        data: {
          id: "generation-1",
          qualityReport: {
            score: 92,
            passed: true,
            level: "excellent",
            blockingIssues: [],
            warnings: [],
            metrics: {},
          },
        },
      },
    });
  });

  it("renders localized completion confirmation and next action", () => {
    renderPlanReady();

    expect(screen.getByText("Plan ready")).toBeTruthy();
    expect(screen.getByText("Your plan is ready")).toBeTruthy();
    expect(screen.getByText("Your meal and workout plans are generated.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start dashboard" })).toBeTruthy();
  });

  it("renders the final plan quality report from the generation job", () => {
    renderPlanReady();

    expect(getQueryResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/onboarding/generation-status/generation-1",
      }),
    );
    expect(screen.getByText("Plan quality")).toBeTruthy();
    expect(screen.getByText("92%")).toBeTruthy();
    expect(screen.getByText("Excellent")).toBeTruthy();
    expect(screen.getByText("Quality gate passed")).toBeTruthy();
  });
});
