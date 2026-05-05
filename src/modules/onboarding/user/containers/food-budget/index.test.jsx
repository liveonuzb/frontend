import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import FoodBudget from "./index.jsx";

const navigate = vi.fn();

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
  useNavigate: () => navigate,
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderFoodBudget = () =>
  render(
    <OnboardingFooterProvider>
      <FoodBudget />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("FoodBudget onboarding step", () => {
  beforeEach(() => {
    navigate.mockClear();
    useOnboardingStore.getState().reset();
  });

  it("renders budget tiers instead of numeric UZS inputs", () => {
    renderFoodBudget();

    expect(
      screen.getByText("onboarding.foodBudget.tiers.low.label"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.foodBudget.tiers.medium.label"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.foodBudget.tiers.high.label"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("UZS")).not.toBeInTheDocument();
  });

  it("stores the selected tier and clears legacy amount fields", async () => {
    renderFoodBudget();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.foodBudget\.tiers\.medium\.label/i,
      }),
    );

    await waitFor(() => {
      expect(useOnboardingStore.getState()).toEqual(
        expect.objectContaining({
          foodBudgetTier: "medium",
          foodBudget: "",
          budgetPeriod: null,
          budgetCurrency: "UZS",
        }),
      );
    });
  });

  it("skip clears tier and continues to allergies", async () => {
    useOnboardingStore.getState().setFields({ foodBudgetTier: "high" });

    renderFoodBudget();
    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.skip",
      }),
    );

    await waitFor(() => {
      expect(useOnboardingStore.getState().foodBudgetTier).toBeNull();
      expect(navigate).toHaveBeenCalledWith("/user/onboarding/allergies");
    });
  });
});
