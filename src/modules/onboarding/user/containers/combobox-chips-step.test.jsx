import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import Allergies from "./allergies";
import DislikedExercises from "./disliked-exercises";

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

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: {
      data: {
        exercises: [
          { id: 1, name: "Push up", isOnboarding: true },
          { id: 2, name: "Squat", isOnboarding: false },
        ],
        allergies: [
          { id: 10, name: "Peanut", isAllergic: true, isOnboarding: true },
          { id: 11, name: "Milk", isAllergic: false, isOnboarding: false },
        ],
      },
    },
    isLoading: false,
    isFetching: false,
  }),
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

describe("OnboardingComboboxChipsStep", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("hides opposite-list catalog items and labels non-onboarding active items", () => {
    useOnboardingStore.getState().setFields({
      preferredExerciseIds: [1],
    });

    render(<DislikedExercises />);

    fireEvent.focus(
      screen.getByPlaceholderText(
        "onboarding.workoutSteps.dislikedExercises.placeholder",
      ),
    );

    expect(screen.queryByText("Push up")).toBeNull();
    expect(screen.getByText("Squat")).toBeTruthy();
    expect(screen.getByText("onboarding.chipSelect.nonOnboarding")).toBeTruthy();
  });

  it("shows allergic ingredients as quick cards while keeping non-allergic ingredients searchable", () => {
    render(<Allergies />);

    expect(
      screen.getByText("onboarding.nutritionSteps.allergies.featuredTitle"),
    ).toBeTruthy();

    fireEvent.click(screen.getByText("Peanut"));
    expect(useOnboardingStore.getState().allergyIds).toEqual([10]);

    fireEvent.focus(
      screen.getByPlaceholderText("onboarding.nutritionSteps.allergies.placeholder"),
    );

    expect(screen.getByText("Milk")).toBeTruthy();
    expect(screen.getAllByText("Peanut").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("onboarding.chipSelect.allergicBadge")).toBeTruthy();
  });

  it("blocks custom add rows that conflict with the opposite list", () => {
    useOnboardingStore.getState().setFields({
      customPreferredExercises: ["Burpee"],
    });

    render(<DislikedExercises />);

    const input = screen.getByPlaceholderText(
      "onboarding.workoutSteps.dislikedExercises.placeholder",
    );
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "burpee" } });

    expect(screen.queryByText("onboarding.chipSelect.addCustom:burpee")).toBeNull();
    expect(screen.getByText("onboarding.workoutSteps.exercises.conflict")).toBeTruthy();
  });
});
