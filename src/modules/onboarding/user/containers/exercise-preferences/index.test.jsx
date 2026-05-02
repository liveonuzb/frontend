import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import ExercisePreferences from "./index";

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
          { id: 1, name: "Push up", categories: [] },
          { id: 2, name: "Squat", categories: [] },
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

describe("ExercisePreferences", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("does not show preferred exercises in disliked suggestions", () => {
    useOnboardingStore.getState().setFields({
      preferredExerciseIds: [1],
    });

    render(<ExercisePreferences />);

    fireEvent.click(
      screen.getByText("onboarding.workoutSteps.exercises.modes.disliked"),
    );

    expect(screen.getAllByText("Push up")).toHaveLength(1);
    expect(screen.getByText("Squat")).toBeTruthy();
  });

  it("does not show custom add row for an opposite-list custom value", () => {
    useOnboardingStore.getState().setFields({
      customPreferredExercises: ["Burpee"],
    });

    render(<ExercisePreferences />);

    fireEvent.click(
      screen.getByText("onboarding.workoutSteps.exercises.modes.disliked"),
    );
    fireEvent.change(
      screen.getByPlaceholderText("onboarding.workoutSteps.exercises.placeholder"),
      { target: { value: "burpee" } },
    );

    expect(screen.queryByText("onboarding.chipSelect.addCustom:burpee")).toBeNull();
    expect(screen.getByText("onboarding.workoutSteps.exercises.conflict")).toBeTruthy();
  });
});
