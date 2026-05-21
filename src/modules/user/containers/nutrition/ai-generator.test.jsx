import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AIGenerator from "./ai-generator.jsx";

const generateAiPlan = vi.fn();

vi.mock("@/hooks/app/use-meal-plan", () => ({
  default: () => ({
    generateAiPlan,
    isGeneratingAi: false,
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

vi.mock("@/hooks/app/use-ai-credits", async () => {
  const actual = await vi.importActual("@/hooks/app/use-ai-credits");

  return {
    ...actual,
    useAiCreditWallet: () => ({
      wallet: {
        remaining: 4,
        isExhausted: false,
      },
    }),
    useAiCreditCosts: () => ({
      costs: {
        [actual.AI_CREDIT_FEATURES.mealPlan7Day]: 5,
      },
    }),
  };
});

describe("AIGenerator AI credits", () => {
  it("shows plan cost and disables generation when credits are insufficient", () => {
    render(<AIGenerator onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));

    expect(screen.getByText("5 AI | 4 left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rejani yaratish/i })).toBeDisabled();
    expect(generateAiPlan).not.toHaveBeenCalled();
  });
});
