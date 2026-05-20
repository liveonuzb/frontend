import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import HealthConstraints from "./index.jsx";

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
      data: params?.isOnboarding === false
        ? [{ key: "back-pain", name: "Back pain", isOnboarding: false }]
        : [{ key: "knee-pain", name: "Knee pain", isOnboarding: true }],
    },
    isLoading: false,
    isFetching: false,
  }),
}));

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderHealthConstraints = () =>
  render(
    <OnboardingFooterProvider>
      <HealthConstraints />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("HealthConstraints onboarding step", () => {
  beforeEach(() => {
    navigate.mockClear();
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("separates no restrictions from empty continue", async () => {
    const { container } = renderHealthConstraints();

    expect(
      screen.getByRole("button", {
        name: /onboarding\.healthConstraints\.none/i,
      }),
    ).toHaveClass("min-h-[52px]");
    expect(
      screen.queryByRole("button", { name: "onboarding.skipForNow" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "onboarding.skip" }),
    ).toBeNull();
    expect(
      await screen.findByRole("button", { name: "onboarding.next" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));

    expect(useOnboardingStore.getState().healthConstraints).toEqual(["none"]);
    expect(
      useOnboardingStore.getState().completedUserOnboardingSteps,
    ).toContain("health-constraints");
    expect(navigate).toHaveBeenCalledWith("/user/onboarding/review");

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.healthConstraints\.none/i,
      }),
    );

    expect(useOnboardingStore.getState().healthConstraints).toEqual(["none"]);
    expect(container.querySelector("[class*='scroll-pb-']")).toHaveClass(
      "overscroll-contain",
    );
  });
});
