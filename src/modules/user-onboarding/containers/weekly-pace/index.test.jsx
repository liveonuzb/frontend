import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import WeeklyPace from "./index.jsx";

const navigate = vi.fn();

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) =>
      values?.value ? `${key}:${values.value}` : key,
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

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderWeeklyPace = () =>
  render(
    <OnboardingFooterProvider>
      <WeeklyPace />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("WeeklyPace onboarding step", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    navigate.mockClear();
    localStorage.clear();
    useOnboardingStore.getState().reset();
  });

  it("gives the mobile illustration more visible space", () => {
    const { container } = renderWeeklyPace();
    const heroImage = screen.getByRole("img", {
      name: /onboarding\.weeklyPace\.heroAlt/i,
    });

    expect(heroImage).toHaveClass("max-h-[220px]");
    expect(container.querySelector("[data-weekly-pace-hero='true']")).toHaveClass(
      "min-h-[210px]",
    );
  });

  it("updates the selected pace and illustration from the slider", () => {
    renderWeeklyPace();

    expect(screen.getByTestId("weekly-pace-slider-card")).toHaveClass(
      "mt-auto",
      "h-[140px]",
      "flex",
      "flex-col",
      "justify-between",
    );
    const sliderCard = screen.getByTestId("weekly-pace-slider-card");
    const sliderControls = screen.getByTestId("weekly-pace-slider-controls");
    const description = screen.getByTestId("weekly-pace-slider-description");

    expect(sliderControls).toHaveClass("w-full");
    expect(sliderControls).not.toHaveClass("mt-auto");
    expect(sliderCard.firstElementChild).toBe(description);
    expect(sliderCard.lastElementChild).toBe(sliderControls);
    expect(
      screen.queryByTestId("weekly-pace-slider-title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("weekly-pace-slider-summary"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("weekly-pace-slider-badge"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("weekly-pace-slider-description")).toHaveClass(
      "w-full",
      "line-clamp-2",
      "text-center",
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "1");
    expect(
      screen.getByRole("img", {
        name: /onboarding\.weeklyPace\.heroAlt:0\.5/i,
      }),
    ).toHaveAttribute("src", "/assets/recommend.png");

    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });

    expect(useOnboardingStore.getState().weeklyPace).toBe(0.75);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByTestId("weekly-pace-slider-card")).toHaveClass(
      "h-[140px]",
    );
    expect(
      screen.getByRole("img", {
        name: /onboarding\.weeklyPace\.heroAlt:0\.75/i,
      }),
    ).toHaveAttribute("src", "/assets/focussed.png");
  });
});
