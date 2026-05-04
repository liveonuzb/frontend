import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import Allergies from "./allergies";
import DietRequirements from "./diet-requirements";
import DislikedExercises from "./disliked-exercises";
import DislikedFoods from "./disliked-foods";
import DislikedIngredients from "./disliked-ingredients";
import PreferredCuisines from "./preferred-cuisines";
import PreferredIngredients from "./preferred-ingredients";

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
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/api", () => {
  const baseOptions = {
    exercises: [{ id: 1, name: "Push up", isOnboarding: true }],
    allergies: [
      { id: 10, name: "Peanut", isAllergic: true, isOnboarding: true },
    ],
    dietRequirements: [{ id: 20, name: "Halal", isOnboarding: true }],
    cuisines: [{ id: 25, name: "Uzbek cuisine", isOnboarding: true }],
    foods: [{ id: 30, name: "Rice", isOnboarding: true }],
    ingredients: [{ id: 40, name: "Salt", isOnboarding: true }],
  };
  const searchOptions = {
    exercises: [{ id: 2, name: "Squat", isOnboarding: false }],
    allergies: [
      { id: 11, name: "Milk", isAllergic: false, isOnboarding: false },
    ],
    dietRequirements: [],
    cuisines: [],
    foods: [],
    ingredients: [],
  };

  return {
    useGetQuery: ({ params } = {}) => ({
      data: {
        data: params?.q ? searchOptions : baseOptions,
      },
      isLoading: false,
      isFetching: false,
    }),
  };
});

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

describe("OnboardingCardChipStep", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("hides opposite-list catalog items and labels non-onboarding search suggestions", () => {
    useOnboardingStore.getState().setFields({
      preferredExerciseIds: [1],
    });

    render(<DislikedExercises />);

    expect(screen.queryByText("Push up")).toBeNull();
    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    fireEvent.change(
      screen.getByLabelText("onboarding.chipSelect.searchLabel"),
      {
        target: { value: "Squat" },
      },
    );

    expect(screen.getByText("Squat")).toBeTruthy();
    expect(
      screen.getByText("onboarding.chipSelect.nonOnboarding"),
    ).toBeTruthy();
  });

  it("shows allergy ingredients as cards and mirrors the legacy allergy field", () => {
    render(<Allergies />);

    fireEvent.click(screen.getByText("Peanut"));
    expect(useOnboardingStore.getState().allergyIds).toEqual([10]);
    expect(useOnboardingStore.getState().allergyIngredientIds).toEqual([10]);

    expect(screen.queryByText("Milk")).toBeNull();
    expect(
      screen.getByText("onboarding.chipSelect.allergicBadge"),
    ).toBeTruthy();
  });

  it("renders card catalog steps as a single row-list layout", () => {
    render(<DislikedFoods />);

    const row = screen.getByText("Rice").closest("button");
    expect(row?.parentElement?.className).toContain("grid");
    expect(row?.parentElement?.className).not.toContain("md:grid-cols");
    expect(row?.parentElement?.className).not.toContain("sm:grid-cols");
  });

  it("renders preferred cuisines as card chips and stores custom cuisines", () => {
    render(<PreferredCuisines />);

    fireEvent.click(screen.getByText("Uzbek cuisine"));
    expect(useOnboardingStore.getState().preferredCuisineIds).toEqual([25]);

    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    const input = screen.getByLabelText("onboarding.chipSelect.searchLabel");
    fireEvent.change(input, { target: { value: "  Korean  " } });
    fireEvent.click(screen.getByText("onboarding.chipSelect.addCustom:Korean"));

    expect(useOnboardingStore.getState().customPreferredCuisines).toEqual([
      "Korean",
    ]);
  });

  it("renders preferred and disliked ingredients with the card chip UI", () => {
    const { rerender } = render(<PreferredIngredients />);

    fireEvent.click(screen.getByText("Salt"));
    expect(useOnboardingStore.getState().preferredIngredientIds).toEqual([40]);

    rerender(<DislikedIngredients />);
    expect(screen.queryByText("Salt")).toBeNull();
    expect(screen.getByText("onboarding.chipSelect.otherTitle")).toBeTruthy();
  });

  it("adds trimmed custom values from the Other search area", () => {
    render(<DietRequirements />);

    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    const input = screen.getByLabelText("onboarding.chipSelect.searchLabel");
    fireEvent.change(input, { target: { value: "  No pork  " } });
    fireEvent.click(
      screen.getByText("onboarding.chipSelect.addCustom:No pork"),
    );

    expect(useOnboardingStore.getState().customDietRequirements).toEqual([
      "No pork",
    ]);
  });

  it("blocks custom add rows that conflict with the opposite list", () => {
    useOnboardingStore.getState().setFields({
      customPreferredExercises: ["Burpee"],
    });

    render(<DislikedExercises />);

    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    const input = screen.getByLabelText("onboarding.chipSelect.searchLabel");
    fireEvent.change(input, { target: { value: "burpee" } });

    expect(
      screen.queryByText("onboarding.chipSelect.addCustom:burpee"),
    ).toBeNull();
    expect(
      screen.getByText("onboarding.workoutSteps.exercises.conflict"),
    ).toBeTruthy();
  });
});
