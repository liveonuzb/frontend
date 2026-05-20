import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import DietRequirements from "./index.jsx";

const navigate = vi.fn();

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) =>
      values?.count !== undefined
        ? `${key}:${values.count}`
        : values?.value
          ? `${key}:${values.value}`
          : key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: ({ params } = {}) => ({
    data: {
      data:
        params?.isOnboarding === false
          ? [{ id: 3, name: "Pescatarian", isOnboarding: false }]
          : [
              { id: 1, name: "Vegetarian", isOnboarding: true },
              { id: 2, name: "Low carb", isOnboarding: true },
            ],
    },
    isError: false,
    isFetching: false,
    isLoading: false,
  }),
}));

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderDietRequirements = () =>
  render(
    <OnboardingFooterProvider>
      <DietRequirements />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("DietRequirements onboarding step", () => {
  beforeEach(() => {
    navigate.mockClear();
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("keeps other options last and removes recommendation badges/chips", () => {
    const { container } = renderDietRequirements();
    const list = container.querySelector("[data-diet-requirements-options]");
    const buttons = within(list).getAllByRole("button");

    expect(buttons[0]).toHaveAccessibleName(/Vegetarian/i);
    expect(buttons[0]).toHaveClass("min-h-[52px]");
    expect(buttons[1]).toHaveAccessibleName(/Low carb/i);
    expect(buttons[buttons.length - 1]).toHaveAccessibleName(
      /onboarding\.chipSelect\.otherTitle/i,
    );
    expect(buttons[buttons.length - 1]).toHaveClass("min-h-[52px]");
    expect(
      screen.queryByText("onboarding.chipSelect.recommendedBadge"),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Vegetarian/i }));

    expect(screen.getAllByText(/dietRequirements\.options\.vegetarian/i)).toHaveLength(
      1,
    );
    expect(useOnboardingStore.getState().dietRequirementIds).toEqual([1]);
  });

  it("adds selected drawer options to the main option list", () => {
    renderDietRequirements();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.chipSelect\.otherTitle/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Pescatarian/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /common\.done/i,
      }),
    );

    expect(screen.getByRole("button", { name: /Pescatarian/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(useOnboardingStore.getState().dietRequirementIds).toEqual([3]);
  });

  it("continues without a separate skip button when no option is selected", () => {
    renderDietRequirements();

    expect(
      screen.queryByRole("button", {
        name: /onboarding\.skipForNow/i,
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.next/i,
      }),
    );

    expect(
      useOnboardingStore.getState().completedUserOnboardingSteps,
    ).toContain("diet-requirements");
    expect(navigate).toHaveBeenCalledWith("/user/onboarding/health-constraints");
  });
});
