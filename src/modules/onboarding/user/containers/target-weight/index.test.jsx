import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import TargetWeight from ".";

const navigateMock = vi.hoisted(() => vi.fn());

const translations = {
  "onboarding.next": "Keyingi",
  "onboarding.targetWeight.question": "Maqsad vazningiz qancha?",
  "onboarding.targetWeight.questionWithName":
    "{{name}}, maqsad vazningiz qancha?",
  "onboarding.targetWeight.bmiTitle": "Maqsad BMI",
  "onboarding.targetWeight.messages.maintain":
    "Siz hozirgi formangizga yaqin qolishni maqsad qilyapsiz.",
  "onboarding.targetWeight.errors.loseDirection":
    "Maqsadingiz ozish bo'lsa, maqsad vazn hozirgi vazndan past bo'lishi kerak.",
  "onboarding.height.unit": "cm",
  "onboarding.illustrationAlt": "Onboarding rasmi",
};

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) => {
      const value = translations[key] ?? key;

      if (values?.name) {
        return value.replace("{{name}}", values.name);
      }

      if (values?.value) {
        return value.replace("{{value}}", values.value);
      }

      return value;
    },
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

vi.mock("@/modules/onboarding/components/weight-ticker", () => ({
  WeightTicker: ({ ariaLabel, value }) => (
    <div aria-label={ariaLabel} role="slider">
      {value}
    </div>
  ),
}));

const renderTargetWeight = () =>
  render(
    <OnboardingFooterProvider>
      <TargetWeight />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("TargetWeight onboarding step", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    useOnboardingStore.getState().reset();
  });

  it("keeps maintenance targets clear and lets users continue with equal weight", () => {
    useOnboardingStore.getState().setFields({
      firstName: "Ali",
      goal: "maintain",
      currentWeight: { value: "70", unit: "kg" },
      targetWeight: { value: "70", unit: "kg" },
      height: { value: "175", unit: "cm" },
    });

    renderTargetWeight();

    expect(
      screen.getByText(
        "Siz hozirgi formangizga yaqin qolishni maqsad qilyapsiz.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keyingi/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /Keyingi/ }));

    expect(useOnboardingStore.getState().targetWeight).toEqual({
      value: "70",
      unit: "kg",
    });
    expect(navigateMock).toHaveBeenCalledWith("/user/onboarding/weekly-pace");
  });

  it("blocks equal target weight for weight loss with helpful copy", () => {
    useOnboardingStore.getState().setFields({
      goal: "lose",
      currentWeight: { value: "70", unit: "kg" },
      targetWeight: { value: "70", unit: "kg" },
      height: { value: "175", unit: "cm" },
    });

    renderTargetWeight();

    expect(
      screen.getByText(
        "Maqsadingiz ozish bo'lsa, maqsad vazn hozirgi vazndan past bo'lishi kerak.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keyingi/ })).toBeDisabled();
  });
});
