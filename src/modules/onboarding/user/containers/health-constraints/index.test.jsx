import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
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

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
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
    useOnboardingStore.getState().reset();
  });

  it("separates no restrictions from skipping the step for now", async () => {
    renderHealthConstraints();

    expect(
      screen.getByRole("button", {
        name: /onboarding\.healthConstraints\.none/i,
      }),
    ).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "onboarding.skipForNow" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "onboarding.skip" }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /onboarding\.healthConstraints\.none/i,
      }),
    );

    expect(useOnboardingStore.getState().healthConstraints).toEqual(["none"]);
  });
});
