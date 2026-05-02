import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import OnboardingChipSuggestionStep from "./chip-suggestion-step";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) =>
      values?.count !== undefined ? `${key}:${values.count}` : key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: { data: { dietRequirements: [] } },
    isLoading: false,
    isFetching: false,
  }),
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

describe("OnboardingChipSuggestionStep", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    useOnboardingStore.getState().reset();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("uses a stable snapshot when no legacy field is configured", () => {
    render(
      <OnboardingChipSuggestionStep
        step="diet-requirements"
        i18nKey="onboarding.nutritionSteps.dietRequirements"
        optionsKey="dietRequirements"
        field="dietRequirementIds"
        customField="customDietRequirements"
        nextPath="/user/onboarding/disliked-foods"
      />,
    );

    expect(
      screen.getByText("onboarding.nutritionSteps.dietRequirements.title"),
    ).toBeTruthy();
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        String(call[0]).includes("getSnapshot should be cached"),
      ),
    ).toBe(false);
  });
});
