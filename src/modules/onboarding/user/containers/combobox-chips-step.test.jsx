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
import PreferredExercises from "./preferred-exercises";
import PreferredIngredients from "./preferred-ingredients";
import WorkoutBodyParts from "./workout-body-parts";
import WorkoutEquipment from "./workout-equipment";

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
    bodyParts: [{ id: 50, name: "Chest", isOnboarding: true }],
    equipment: [{ id: 60, name: "Dumbbell", isOnboarding: true }],
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
    bodyParts: [],
    equipment: [],
  };
  const otherOptions = {
    exercises: [{ id: 2, name: "Squat", isOnboarding: false }],
    allergies: [
      { id: 11, name: "Milk", isAllergic: false, isOnboarding: false },
    ],
    dietRequirements: [{ id: 21, name: "Kosher", isOnboarding: false }],
    cuisines: [],
    foods: [{ id: 31, name: "Burger", isOnboarding: false }],
    ingredients: [{ id: 41, name: "Pepper", isOnboarding: false }],
    bodyParts: [{ id: 51, name: "Back", isOnboarding: false }],
    equipment: [{ id: 61, name: "Kettlebell", isOnboarding: false }],
  };

  return {
    useGetQuery: ({ params } = {}) => ({
      data: {
        data: params?.isOnboarding === false
          ? params?.q
            ? searchOptions
            : otherOptions
          : baseOptions,
      },
      isLoading: false,
      isFetching: false,
    }),
  };
});

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

describe("onboarding catalog card containers", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("renders every migrated catalog step container", () => {
    const cases = [
      [WorkoutEquipment, "onboarding.workoutSteps.equipment.title"],
      [WorkoutBodyParts, "onboarding.workoutSteps.bodyParts.title"],
      [
        PreferredExercises,
        "onboarding.workoutSteps.preferredExercises.title",
      ],
      [DislikedExercises, "onboarding.workoutSteps.dislikedExercises.title"],
      [Allergies, "onboarding.nutritionSteps.allergies.title"],
      [
        DietRequirements,
        "onboarding.nutritionSteps.dietRequirements.title",
      ],
      [PreferredCuisines, "onboarding.nutritionSteps.preferredCuisines.title"],
      [DislikedFoods, "onboarding.nutritionSteps.dislikedFoods.title"],
      [
        PreferredIngredients,
        "onboarding.nutritionSteps.preferredIngredients.title",
      ],
      [
        DislikedIngredients,
        "onboarding.nutritionSteps.dislikedIngredients.title",
      ],
    ];

    cases.forEach(([Component, title]) => {
      useOnboardingStore.getState().reset();
      const { unmount } = render(<Component />);

      expect(screen.getByText(title)).toBeTruthy();
      expect(screen.getByText("onboarding.chipSelect.otherTitle")).toBeTruthy();

      unmount();
    });
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

  it("shows available options in the Other drawer before search is typed", () => {
    render(<DietRequirements />);

    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));

    expect(screen.getByText("Kosher")).toBeTruthy();
    expect(screen.getAllByText("Halal")).toHaveLength(1);
  });

  it("shows selected catalog and custom values inside the Other drawer", () => {
    render(<DietRequirements />);

    fireEvent.click(screen.getByText("Halal"));
    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    const input = screen.getByLabelText("onboarding.chipSelect.searchLabel");
    fireEvent.change(input, { target: { value: "  No pork  " } });
    fireEvent.click(
      screen.getByText("onboarding.chipSelect.addCustom:No pork"),
    );

    expect(
      screen.getAllByText("onboarding.chipSelect.selectedCount:2"),
    ).toHaveLength(1);
    expect(screen.getAllByText("Halal").length).toBeGreaterThan(1);
    expect(screen.getAllByText("No pork").length).toBeGreaterThan(1);
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

  it("blocks custom ingredient rows that conflict with the opposite list", () => {
    useOnboardingStore.getState().setFields({
      customPreferredIngredients: ["Pepper"],
    });

    render(<DislikedIngredients />);

    fireEvent.click(screen.getByText("onboarding.chipSelect.otherTitle"));
    const input = screen.getByLabelText("onboarding.chipSelect.searchLabel");
    fireEvent.change(input, { target: { value: "pepper" } });

    expect(
      screen.queryByText("onboarding.chipSelect.addCustom:pepper"),
    ).toBeNull();
    expect(
      screen.getByText("onboarding.nutritionSteps.ingredients.conflict"),
    ).toBeTruthy();
  });
});
