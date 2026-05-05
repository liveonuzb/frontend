import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import ResultPage, { ResultContent } from "./index.jsx";

const navigateMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const setOnboardingFlowMock = vi.hoisted(() => vi.fn());
const startGenerationMock = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
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

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      setOnboardingFlow: setOnboardingFlowMock,
    }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    isLoading: false,
    data: {
      data: {
        data: {
          result: {
            dailyCalories: 2100,
            carbsGram: 230,
            proteinGram: 160,
            fatGram: 65,
            recommendedWaterMl: 2500,
            weightToChange: -10,
            weeklyWeightChangeGoal: 0.5,
            bmr: 1700,
            tdee: 2400,
            bmi: 23.4,
            dailyStepsTarget: 8000,
            metabolicAge: 28,
          },
          onboarding: {
            currentWeight: { value: 70, unit: "kg" },
            goal: "lose",
            activityLevel: "moderately-active",
            foodBudgetTier: "medium",
          },
        },
      },
    },
  }),
  usePatchQuery: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  usePutQuery: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  usePostQuery: () => ({
    mutateAsync: startGenerationMock,
    isPending: false,
  }),
}));

const renderResultPage = () =>
  render(
    <OnboardingFooterProvider>
      <ResultPage />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("PersonalizationResult onboarding screen", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    invalidateQueriesMock.mockClear();
    setOnboardingFlowMock.mockClear();
    startGenerationMock.mockReset();
    startGenerationMock.mockResolvedValue({
      data: {
        data: {
          id: "job-1",
          flowStatus: "PLAN_GENERATING",
          nextPath: "/user/onboarding/generating/job-1",
        },
      },
    });
  });

  it("renders the mobile-first result summary with one daily calorie block and no removed sections", () => {
    render(<ResultContent result={{}} onboarding={{}} onEdit={vi.fn()} />);

    expect(screen.getByText("Shaxsiy maqsadlar tayyor")).toBeTruthy();
    expect(screen.getByText("Sizning rejangiz tayyor")).toBeTruthy();
    expect(screen.getAllByText("Kunlik kaloriya")).toHaveLength(1);
    expect(screen.getByText("2,100")).toBeTruthy();
    expect(screen.getByText("Uglevod")).toBeTruthy();
    expect(screen.getByText("Oqsil")).toBeTruthy();
    expect(screen.getByText("Yog'")).toBeTruthy();
    expect(screen.getByText("Suv")).toBeTruthy();
    expect(screen.getByText("2.5 L")).toBeTruthy();
    expect(screen.getByText("Hozirgi vazn")).toBeTruthy();
    expect(screen.getByText("70 kg")).toBeTruthy();
    expect(screen.getByText("Maqsad")).toBeTruthy();
    expect(screen.getByText("Ozish")).toBeTruthy();
    expect(screen.getByText("Aktivlik")).toBeTruthy();
    expect(screen.getByText("O'rtacha faol")).toBeTruthy();
    expect(screen.getByText("Budjet")).toBeTruthy();
    expect(screen.getByText("Medium budget")).toBeTruthy();
    expect(screen.getByText("Qanday hisoblaymiz?")).toBeTruthy();

    expect(screen.queryByText("Reja inputlari")).toBeNull();
    expect(screen.queryByText("Jihozlar")).toBeNull();
    expect(screen.queryByText("Mashg'ulot joyi")).toBeNull();
    expect(screen.queryByText("Mashg'ulot kunlari")).toBeNull();
    expect(screen.queryByText("Ovqatlanish soni")).toBeNull();
    expect(screen.queryByText("Kaloriya")).toBeNull();
  });

  it("keeps the next CTA wired to personal plan generation", async () => {
    renderResultPage();

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    await waitFor(() => {
      expect(startGenerationMock).toHaveBeenCalledWith({
        url: "/user/onboarding/generate-personal-plan",
      });
    });
    expect(setOnboardingFlowMock).toHaveBeenCalledWith({
      onboardingFlowStatus: "PLAN_GENERATING",
      onboardingNextPath: "/user/onboarding/generating/job-1",
      latestPlanGenerationJobId: "job-1",
    });
    expect(navigateMock).toHaveBeenCalledWith(
      "/user/onboarding/generating/job-1",
      { replace: true },
    );
  });
});
