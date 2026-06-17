import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AIGenerator from "./ai-generator.jsx";

const generateAiPlan = vi.hoisted(() => vi.fn());
const mealPlanHookState = vi.hoisted(() => ({
  isGeneratingAi: false,
}));
const aiAccessState = vi.hoisted(() => ({
  wallet: {
    status: "trial_active",
    dailyLimit: 3,
    remainingToday: 0,
  },
  costs: {},
}));
const pantryHookState = vi.hoisted(() => ({
  pantryItems: [],
}));

vi.mock("@/hooks/app/use-meal-plan", () => ({
  default: () => ({
    generateAiPlan,
    isGeneratingAi: mealPlanHookState.isGeneratingAi,
  }),
}));

vi.mock("@/hooks/app/use-nutrition-ai.js", () => ({
  useNutritionAiPantry: () => ({
    pantryItems: pantryHookState.pantryItems,
    isLoading: false,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <div>{children}</div>,
  DrawerHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/hooks/app/use-ai-access", async () => {
  const actual = await vi.importActual("@/hooks/app/use-ai-access");

  return {
    ...actual,
    useAiAccessStatus: () => aiAccessState,
  };
});

describe("AIGenerator AI access", () => {
  beforeEach(() => {
    generateAiPlan.mockReset();
    aiAccessState.wallet = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 0,
    };
    aiAccessState.costs = {};
    pantryHookState.pantryItems = [];
    mealPlanHookState.isGeneratingAi = false;
  });

  it("shows daily limit status and disables generation when quota is exhausted", () => {
    render(<AIGenerator onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));

    expect(screen.getByText("Bugun 0/3 qoldi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rejani yaratish/i })).toBeDisabled();
    expect(generateAiPlan).not.toHaveBeenCalled();
  });

  it("sends budget and price context when generating an AI plan", async () => {
    aiAccessState.wallet = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 3,
    };
    generateAiPlan.mockResolvedValue({
      draftPlan: { id: "plan-1", days: [] },
    });
    const onClose = vi.fn();
    const onGenerated = vi.fn();

    render(<AIGenerator onClose={onClose} onGenerated={onGenerated} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));
    fireEvent.change(screen.getByLabelText("UZS byudjet"), {
      target: { value: "350000" },
    });
    fireEvent.change(screen.getByLabelText("Narx hududi"), {
      target: { value: "tashkent" },
    });
    fireEvent.change(screen.getByLabelText("Narx mavsumi"), {
      target: { value: "winter" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rejani yaratish/i }));

    await waitFor(() => {
      expect(generateAiPlan).toHaveBeenCalledWith({
        goal: "weight-loss",
        mealCount: 4,
        budgetAmount: 350000,
        budgetPeriod: "weekly",
        regionKey: "tashkent",
        season: "winter",
      });
    });
    expect(onGenerated).toHaveBeenCalledWith({ id: "plan-1", days: [] });
    expect(onClose).toHaveBeenCalled();
  });

  it("sends pantry context when generating an AI plan", async () => {
    aiAccessState.wallet = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 3,
    };
    pantryHookState.pantryItems = [
      {
        id: "pantry-1",
        ingredientId: 11,
        name: "Tuxum",
        quantity: 6,
        unit: "dona",
        grams: 300,
      },
    ];
    generateAiPlan.mockResolvedValue({
      draftPlan: { id: "plan-pantry", days: [] },
    });

    render(<AIGenerator onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));
    expect(screen.getByText("Ombor konteksti: 1 ta mahsulot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rejani yaratish/i }));

    await waitFor(() => {
      expect(generateAiPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          pantryItems: [
            {
              id: "pantry-1",
              ingredientId: 11,
              name: "Tuxum",
              quantity: 6,
              unit: "dona",
              grams: 300,
            },
          ],
        }),
      );
    });
  });

  it("shows an explicit generating state while the AI plan job is running", () => {
    aiAccessState.wallet = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 3,
    };
    mealPlanHookState.isGeneratingAi = true;

    render(<AIGenerator onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));

    expect(screen.getByRole("button", { name: /Reja tuzilmoqda/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Bekor qilish/i })).toBeDisabled();
  });
});
