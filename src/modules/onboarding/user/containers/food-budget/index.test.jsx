import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import FoodBudget from "./index.jsx";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/modules/onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

describe("FoodBudget onboarding step", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("uses the number field with a default weekly UZS budget", async () => {
    render(<FoodBudget />);

    await waitFor(() => {
      expect(useOnboardingStore.getState().foodBudget).toBe("250000");
    });

    expect(screen.getByRole("textbox")).toHaveValue("250,000");
    expect(useOnboardingStore.getState().budgetPeriod).toBe("weekly");
    expect(useOnboardingStore.getState().budgetCurrency).toBe("UZS");
    expect(screen.getByText("UZS")).toBeInTheDocument();
  });

  it("updates the default budget when period changes", async () => {
    render(<FoodBudget />);

    await waitFor(() => {
      expect(useOnboardingStore.getState().foodBudget).toBe("250000");
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.foodBudget.periods.daily",
      }),
    );

    await waitFor(() => {
      expect(useOnboardingStore.getState().budgetPeriod).toBe("daily");
      expect(useOnboardingStore.getState().foodBudget).toBe("50000");
    });
    expect(screen.getByRole("textbox")).toHaveValue("50,000");

    fireEvent.click(
      screen.getByRole("button", {
        name: "onboarding.foodBudget.periods.monthly",
      }),
    );

    await waitFor(() => {
      expect(useOnboardingStore.getState().budgetPeriod).toBe("monthly");
      expect(useOnboardingStore.getState().foodBudget).toBe("1000000");
    });
    expect(screen.getByRole("textbox")).toHaveValue("1,000,000");
  });
});
