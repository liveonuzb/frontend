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

vi.mock("@/hooks/app/use-ai-access", async () => {
  const actual = await vi.importActual("@/hooks/app/use-ai-access");

  return {
    ...actual,
    useAiAccessStatus: () => ({
      wallet: {
        status: "trial_active",
        dailyLimit: 3,
        remainingToday: 0,
      },
      costs: {},
    }),
  };
});

describe("AIGenerator AI access", () => {
  it("shows daily limit status and disables generation when quota is exhausted", () => {
    render(<AIGenerator onClose={vi.fn()} onGenerated={vi.fn()} />);

    fireEvent.click(screen.getByText("Vazn yo'qotish"));

    expect(screen.getByText("Bugun 0/3 qoldi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rejani yaratish/i })).toBeDisabled();
    expect(generateAiPlan).not.toHaveBeenCalled();
  });
});
