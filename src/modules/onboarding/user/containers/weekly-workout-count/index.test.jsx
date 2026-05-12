import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/onboarding/lib/onboarding-footer-context";
import WeeklyWorkoutCount from ".";

const navigateMock = vi.hoisted(() => vi.fn());

const translations = {
  "onboarding.next": "Keyingi",
  "onboarding.lifestyle.weeklyWorkoutCount":
    "Haftasiga nechta mashg'ulot qilasiz?",
  "onboarding.lifestyle.weeklyWorkoutCountDescription":
    "Reja haftalik ritmingizga mos bo'lishi uchun real sonni tanlang.",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.none.title": "Qilmayman",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.none.description":
    "Hozircha mashg'ulot rejasini qo'shmaymiz. Keyin o'zgartirish mumkin.",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.light.title": "Yengil start",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.light.description":
    "Haftasiga 1-2 marta",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.balanced.title":
    "Balansli ritm",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.balanced.description":
    "Haftasiga 3-4 marta",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.active.title": "Faol ritm",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.active.description":
    "Haftasiga 5-6 marta",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.daily.title": "Har kuni",
  "onboarding.lifestyle.weeklyWorkoutCountOptions.daily.description":
    "Har kuni qisqa yoki to'liq mashg'ulot",
};

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key, values) => {
      if (key === "onboarding.lifestyle.weeklyWorkoutCountOption") {
        return `${values.count} kun`;
      }

      return translations[key] ?? key;
    },
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderWeeklyWorkoutCount = () =>
  render(
    <OnboardingFooterProvider>
      <WeeklyWorkoutCount />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("WeeklyWorkoutCount onboarding step", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    useOnboardingStore.getState().reset();
  });

  it("shows rhythm options instead of separate day cards while storing numeric backend values", async () => {
    renderWeeklyWorkoutCount();

    expect(screen.getByRole("button", { name: /Qilmayman/ })).toBeTruthy();
    expect(screen.queryByText("0 kun")).toBeNull();
    expect(screen.queryByText("1 kun")).toBeNull();
    expect(screen.getByRole("button", { name: /Yengil start/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Balansli ritm/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Faol ritm/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Har kuni/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Balansli ritm/ }));

    expect(useOnboardingStore.getState().weeklyWorkoutCount).toBe("4");

    fireEvent.click(screen.getByRole("button", { name: /Qilmayman/ }));

    expect(useOnboardingStore.getState().weeklyWorkoutCount).toBe("0");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Keyingi" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(navigateMock).toHaveBeenCalledWith("/user/onboarding/review", {
      state: { returnTo: "/user/onboarding/weekly-workout-count" },
    });
    expect(useOnboardingStore.getState()).toEqual(
      expect.objectContaining({
        workoutExperience: "",
        workoutLocation: "",
        equipmentIds: [],
        customEquipment: [],
        workoutBodyPartIds: [],
        customWorkoutBodyParts: [],
      }),
    );
  });

  it("returns to workout setup when the user changes from no workouts to an active rhythm", async () => {
    renderWeeklyWorkoutCount();

    fireEvent.click(screen.getByRole("button", { name: /Qilmayman/ }));
    expect(useOnboardingStore.getState().weeklyWorkoutCount).toBe("0");
    expect(useOnboardingStore.getState().workoutLocation).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /Yengil start/ }));

    expect(useOnboardingStore.getState().weeklyWorkoutCount).toBe("2");
    expect(useOnboardingStore.getState().workoutLocation).toBe("home");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Keyingi" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/user/onboarding/workout-experience",
    );
  });
});
