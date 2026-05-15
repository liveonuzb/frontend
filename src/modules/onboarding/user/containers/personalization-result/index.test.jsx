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
const confirmMetabolismMock = vi.hoisted(() => vi.fn());
const patchResultMock = vi.hoisted(() => vi.fn());
const getQueryResultMock = vi.hoisted(() => vi.fn());

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
  useGetQuery: () => getQueryResultMock(),
  usePatchQuery: () => ({
    mutateAsync: patchResultMock,
    isPending: false,
  }),
  usePutQuery: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  usePostQuery: vi.fn(() => ({
    mutateAsync: confirmMetabolismMock,
    isPending: false,
  })),
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
    getQueryResultMock.mockReset();
    getQueryResultMock.mockReturnValue({
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
    });
    confirmMetabolismMock.mockReset();
    confirmMetabolismMock.mockResolvedValue({
      data: {
        data: {
          status: "ACTIVATED",
          onboardingFlowStatus: "ACTIVATED",
          onboardingNextPath: "/user",
          activatedAt: "2026-05-01T09:05:00.000Z",
        },
      },
    });
  });

  it("renders the premium mobile result summary with all required sections", () => {
    render(<ResultContent result={{}} onboarding={{}} onEdit={vi.fn()} />);

    expect(screen.getByText("Metabolizm hisobingiz tayyor")).toBeTruthy();
    expect(screen.getByText("AI tahlili")).toBeTruthy();
    expect(screen.getAllByText("Kunlik kaloriya maqsadi")).toHaveLength(1);
    expect(screen.getByText("2,100")).toBeTruthy();
    expect(
      screen.getByText(
        "AI sizning maqsadingiz, hozirgi vazningiz, faollik darajangiz va ovqatlanish ritmingiz asosida boshlang'ich targetlarni tayyorladi.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("Uglevod").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Oqsil").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Yog'").length).toBeGreaterThan(0);
    expect(screen.getByText("Suv")).toBeTruthy();
    expect(screen.getAllByText("2.5 L").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hozirgi vazn").length).toBeGreaterThan(0);
    expect(screen.getAllByText("70 kg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Maqsad vazn").length).toBeGreaterThan(0);
    expect(screen.queryByText("Makro energiya")).toBeNull();
    const dailyIndicatorsTitle = screen.getByText(
      "Kunlik maqsad va ko'rsatkichlar",
    );
    const calculationTitle = screen.getByText("Hisoblash zanjiri");
    expect(
      Boolean(
        dailyIndicatorsTitle.compareDocumentPosition(calculationTitle) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(screen.queryByText("Profil va sozlamalar")).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Kunlik kaloriya maqsadini tahrirlash",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Oqsilni tahrirlash" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Uglevodni tahrirlash" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Yog'ni tahrirlash" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Suvni tahrirlash" }),
    ).toBeTruthy();
    expect(screen.getByText("Suv maqsadi")).toBeTruthy();
    expect(screen.getByText("Qadam")).toBeTruthy();
    expect(screen.getAllByText("BMR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TDEE").length).toBeGreaterThan(0);
    expect(screen.getByText("BMI")).toBeTruthy();
    expect(screen.getByText("Metabolik yosh")).toBeTruthy();
    expect(screen.getByText("Maqsad sanasi")).toBeTruthy();
    expect(screen.queryByText("Ovqatlanish")).toBeNull();
    expect(screen.queryByText("Mashg'ulot")).toBeNull();
    expect(screen.queryByText("Byudjet")).toBeNull();

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

    ["Hozirgi vazn", "Maqsad vazn", "Vazn farqi", "Haftalik sur'at"].forEach(
      (label) => {
        screen.getAllByText(label).forEach((node) => {
          expect(node.closest("button")).toBeNull();
        });
      },
    );
  });

  it("renders an empty state instead of fallback metrics when API result is null", () => {
    getQueryResultMock.mockReturnValueOnce({
      isLoading: false,
      data: {
        data: {
          data: {
            result: null,
            onboarding: {
              currentWeight: { value: 70, unit: "kg" },
              goal: "lose",
            },
          },
        },
      },
    });

    renderResultPage();

    expect(
      screen.getByText("onboarding.postOnboarding.result.empty"),
    ).toBeTruthy();
    expect(screen.queryByText("2,100")).toBeNull();
  });

  it("prefills the calorie drawer and disables save for empty input without warning", () => {
    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Kunlik kaloriya maqsadini tahrirlash",
      }),
    );

    const calorieInput = screen.getByRole("textbox", {
      name: "onboarding.postOnboarding.result.edit.dailyCalories.title",
    });
    expect(calorieInput.value.replace(/,/g, "")).toBe("2100");
    expect(
      screen.queryByRole("button", {
        name: "onboarding.postOnboarding.result.cancel",
      }),
    ).toBeNull();

    fireEvent.change(calorieInput, {
      target: { value: "" },
    });

    expect(
      screen.queryByText("onboarding.postOnboarding.result.lowCalorieWarning"),
    ).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "onboarding.postOnboarding.result.save",
      }),
    ).toBeDisabled();
  });

  it("renders the daily indicators before the calculation report chain", () => {
    render(
      <ResultContent
        result={{
          dailyCalories: 2364,
          carbsGram: 263,
          proteinGram: 180,
          fatGram: 66,
          bmr: 1880,
          tdee: 2914,
          calculationReport: {
            formula: { bmr: "mifflin_st_jeor", version: "v1" },
            activity: { multiplier: 1.55, bmr: 1880, tdee: 2914 },
            calories: {
              goalAdjustment: -550,
              final: 2364,
              floorApplied: false,
              capApplied: false,
            },
            macros: {
              protein: { grams: 180, calories: 720, percent: 30.5 },
              carbs: { grams: 263, calories: 1052, percent: 44.5 },
              fat: { grams: 66, calories: 594, percent: 25.1 },
              totalCalories: 2366,
              calorieDelta: 2,
            },
            confidence: { level: "standard", reasons: [] },
            warnings: [],
          },
        }}
        onboarding={{
          currentWeight: { value: 90, unit: "kg" },
          targetWeight: { value: 80, unit: "kg" },
          goal: "lose",
          activityLevel: "moderately-active",
        }}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Hisoblash zanjiri")).toBeTruthy();
    expect(screen.queryByText("Makro energiya")).toBeNull();
    expect(
      Boolean(
        screen
          .getByText("Kunlik maqsad va ko'rsatkichlar")
          .compareDocumentPosition(screen.getByText("Hisoblash zanjiri")) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(screen.getByText("Mifflin-St Jeor")).toBeTruthy();
    expect(screen.getByText("x1.55")).toBeTruthy();
    expect(screen.getAllByText("1,880 kcal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2,914 kcal").length).toBeGreaterThan(0);
    expect(screen.getByText("-550 kcal")).toBeTruthy();
    expect(screen.getAllByText("2,364 kcal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("30.5%").length).toBeGreaterThan(0);
  });

  it("uses goal-specific explanation copy when the API has no explanation", () => {
    render(
      <ResultContent
        result={{ explanation: "" }}
        onboarding={{ goal: "maintain" }}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Vazn saqlash maqsadi uchun kaloriyalar TDEE atrofida ushlab turildi, makrolar esa hozirgi vazn va faollik darajasiga moslandi.",
      ),
    ).toBeTruthy();
  });

  it("lets users edit macro targets before starting generation", async () => {
    renderResultPage();

    fireEvent.click(screen.getByRole("button", { name: "Oqsilni tahrirlash" }));
    expect(screen.queryByText(/Makro energiya/i)).toBeNull();
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "onboarding.postOnboarding.result.edit.proteinGram.title",
      }),
      {
        target: { value: "170" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.postOnboarding.result.save",
      }),
    );

    await waitFor(() => {
      expect(patchResultMock).toHaveBeenCalledWith({
        url: "/user/onboarding/metabolism-result",
        attributes: { proteinGram: 170 },
      });
    });
  });

  it("lets users edit water target in liters and saves milliliters", async () => {
    renderResultPage();

    fireEvent.click(screen.getByRole("button", { name: "Suvni tahrirlash" }));
    const waterInput = screen.getByRole("textbox", {
      name: "onboarding.postOnboarding.result.edit.recommendedWaterMl.title",
    });
    expect(waterInput).toHaveValue("2.5");

    fireEvent.change(waterInput, {
      target: { value: "3.2" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.postOnboarding.result.save",
      }),
    );

    await waitFor(() => {
      expect(patchResultMock).toHaveBeenCalledWith({
        url: "/user/onboarding/metabolism-result",
        attributes: { recommendedWaterMl: 3200 },
      });
    });
  });

  it("confirms metabolism and opens the dashboard", async () => {
    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.postOnboarding.result.openDashboard",
      }),
    );

    await waitFor(() => {
      expect(confirmMetabolismMock).toHaveBeenCalledWith({
        url: "/user/onboarding/confirm-metabolism",
      });
    });
    expect(setOnboardingFlowMock).toHaveBeenCalledWith({
      onboardingFlowStatus: "ACTIVATED",
      onboardingNextPath: "/user",
      latestPlanGenerationJobId: null,
    });
    expect(navigateMock).toHaveBeenCalledWith("/user/dashboard", {
      replace: true,
    });
  });
});
