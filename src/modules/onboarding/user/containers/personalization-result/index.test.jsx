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
const patchResultMock = vi.hoisted(() => vi.fn());

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
            targetWeight: 60,
            bmr: 1700,
            tdee: 2400,
            bmi: 23.4,
            dailyStepsTarget: 8000,
            metabolicAge: 28,
            estimatedGoalDate: "2026-09-01T00:00:00.000Z",
            mealsPerDay: 3,
            weeklyWorkoutDays: 4,
            explanation:
              "AI sizning maqsadingiz va ritmingiz asosida targetlarni mosladi.",
          },
          onboarding: {
            currentWeight: { value: 70, unit: "kg" },
            targetWeight: { value: 60, unit: "kg" },
            goal: "lose",
            activityLevel: "moderately-active",
            foodBudgetTier: "medium",
          },
        },
      },
    },
  }),
  usePatchQuery: () => ({
    mutateAsync: patchResultMock,
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
    patchResultMock.mockReset();
    patchResultMock.mockResolvedValue({ data: { data: {} } });
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
    expect(screen.getByText("AI izohi")).toBeTruthy();
    expect(
      screen.getByText(
        "AI sizning maqsadingiz, hozirgi vazningiz, faollik darajangiz va ovqatlanish ritmingiz asosida boshlang'ich targetlarni tayyorladi.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Uglevod")).toBeTruthy();
    expect(screen.getByText("Oqsil")).toBeTruthy();
    expect(screen.getByText("Yog'")).toBeTruthy();
    expect(screen.getByText("Suv")).toBeTruthy();
    expect(screen.getAllByText("2.5 L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hozirgi vazn").length).toBeGreaterThan(0);
    expect(screen.getAllByText("70 kg").length).toBeGreaterThan(0);
    expect(screen.getByText("Maqsad")).toBeTruthy();
    expect(screen.getByText("Ozish")).toBeTruthy();
    expect(screen.getByText("Aktivlik")).toBeTruthy();
    expect(screen.getByText("O'rtacha faol")).toBeTruthy();
    expect(screen.getByText("Budjet")).toBeTruthy();
    expect(screen.getByText("O'rtacha budjet")).toBeTruthy();
    expect(screen.getByText("Suv maqsadi")).toBeTruthy();
    expect(screen.getByText("Qadam")).toBeTruthy();
    expect(screen.getByText("BMR")).toBeTruthy();
    expect(screen.getByText("TDEE")).toBeTruthy();
    expect(screen.getByText("BMI")).toBeTruthy();
    expect(screen.getByText("Metabolik yosh")).toBeTruthy();
    expect(screen.getByText("Maqsad sanasi")).toBeTruthy();
    expect(screen.getByText("Ovqatlanish")).toBeTruthy();
    expect(screen.getByText("Qanday hisoblaymiz?")).toBeTruthy();

    expect(screen.queryByText("Reja inputlari")).toBeNull();
    expect(screen.queryByText("Jihozlar")).toBeNull();
    expect(screen.queryByText("Mashg'ulot joyi")).toBeNull();
    expect(screen.queryByText("Mashg'ulot kunlari")).toBeNull();
    expect(screen.queryByText("Ovqatlanish soni")).toBeNull();
    expect(screen.queryByText("equipment")).toBeNull();
    expect(screen.queryByText("Kaloriya")).toBeNull();
  });

  it("keeps hero goal metrics read-only", () => {
    render(<ResultContent result={{}} onboarding={{}} onEdit={vi.fn()} />);

    [
      "Hozirgi vazn",
      "Maqsad vazn",
      "Vazn farqi (maqsad)",
      "Haftalik sur'at",
    ].forEach((label) => {
      screen.getAllByText(label).forEach((node) => {
        expect(node.closest("button")).toBeNull();
      });
    });
  });

  it("lets users edit macro targets before starting generation", async () => {
    renderResultPage();

    fireEvent.click(screen.getByText("Oqsil").closest("button"));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "170" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.postOnboarding.result.save",
      }),
    );

    await waitFor(() => {
      expect(patchResultMock).toHaveBeenCalledWith({
        url: "/user/onboarding/personalization-result",
        attributes: { proteinGram: 170 },
      });
    });
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
