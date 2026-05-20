import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
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

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
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
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("renders meal frequency cards without an illustration image", () => {
    const { container } = renderMealFrequency();

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
    expect(container.querySelector("[class*='scroll-pb-']")).toHaveClass(
      "overscroll-contain",
    );
    expect(
      container.querySelectorAll("[data-meal-frequency-option='true']"),
    ).toHaveLength(4);
    expect(
      container.querySelector("[data-meal-frequency-option='true']"),
    ).toHaveClass("min-h-[72px]");
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
      expect(
        screen.getByRole("button", {
          name: /onboarding\.next/i,
        }),
      ).toBeEnabled();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.next/i,
      }),
    );

    expect(navigate).toHaveBeenCalledWith("/user/onboarding/diet-requirements");
  });
});
