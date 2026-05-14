import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import MealFrequency from "./index.jsx";

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

const renderMealFrequency = () =>
  render(
    <OnboardingFooterProvider>
      <MealFrequency />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("MealFrequency onboarding step", () => {
  beforeEach(() => {
    navigate.mockClear();
    useOnboardingStore.getState().reset();
  });

  it("renders meal frequency cards without an illustration image", () => {
    renderMealFrequency();

    expect(
      screen.getByText("onboarding.mealFrequency.options.2.label"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.mealFrequency.options.3.label"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.mealFrequency.options.4.label"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.mealFrequency.options.5.label"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("stores the selected meal frequency", async () => {
    renderMealFrequency();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.mealFrequency\.options\.4\.label/i,
      }),
    );

    await waitFor(() => {
      expect(useOnboardingStore.getState().mealFrequency).toBe("4");
    });
  });

  it("requires a selection before continuing", async () => {
    renderMealFrequency();

    const nextButton = screen.getByRole("button", {
      name: /onboarding\.next/i,
    });
    expect(nextButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.mealFrequency\.options\.3\.label/i,
      }),
    );

    await waitFor(() => {
      expect(nextButton).toBeEnabled();
    });

    fireEvent.click(nextButton);

    expect(navigate).toHaveBeenCalledWith("/user/onboarding/allergies");
  });
});
