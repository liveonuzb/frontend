import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import Goal from "./index.jsx";

const navigate = vi.fn();

const translations = {
  "onboarding.goal.question": "Goal question",
  "onboarding.goal.lose": "Lose",
  "onboarding.goal.loseDescription": "Lose description",
  "onboarding.goal.maintain": "Maintain",
  "onboarding.goal.maintainDescription": "Maintain description",
  "onboarding.goal.gain": "Gain",
  "onboarding.goal.gainDescription": "Gain description",
  "onboarding.next": "Next",
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
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/app/use-onboarding-base", () => ({
  useOnboardingAssets: () => ({
    asset: (name) => `/assets/${name}.png`,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: { data: [] },
    isError: false,
    isFetching: false,
    isLoading: false,
  }),
}));

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderGoal = () =>
  render(
    <OnboardingFooterProvider>
      <Goal />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("Goal onboarding step", () => {
  beforeEach(() => {
    navigate.mockClear();
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("uses compact goal options without descriptions", () => {
    renderGoal();

    expect(screen.queryByText("Lose description")).toBeNull();
    expect(screen.queryByText("Maintain description")).toBeNull();
    expect(screen.queryByText("Gain description")).toBeNull();
    expect(screen.getByRole("button", { name: /Lose/i })).toHaveClass(
      "min-h-[84px]",
    );
  });
});
