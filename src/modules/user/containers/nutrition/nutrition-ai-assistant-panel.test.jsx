import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionAiAssistantPanel from "./nutrition-ai-assistant-panel.jsx";

const mockCreatePantryItem = vi.fn();
const mockDeletePantryItem = vi.fn();
const mockScanPantryImage = vi.fn();
const mockGetRecipeAssistant = vi.fn();
const mockGetSubstitutions = vi.fn();

vi.mock("@/hooks/app/use-nutrition-ai.js", () => ({
  useNutritionAiPantry: () => ({
    pantryItems: [
      {
        id: "pantry-1",
        name: "Guruch",
        quantity: 2,
        unit: "kg",
      },
    ],
    createPantryItem: mockCreatePantryItem,
    deletePantryItem: mockDeletePantryItem,
    scanPantryImage: mockScanPantryImage,
    getRecipeAssistant: mockGetRecipeAssistant,
    getSubstitutions: mockGetSubstitutions,
    isLoading: false,
    isCreatingPantryItem: false,
    isDeletingPantryItem: false,
    isScanningPantry: false,
    isRecipeAssistantPending: false,
    isSubstitutionPending: false,
  }),
}));

describe("NutritionAiAssistantPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePantryItem.mockResolvedValue({});
    mockDeletePantryItem.mockResolvedValue({});
    mockScanPantryImage.mockResolvedValue({
      suggestions: [
        {
          name: "kartoshka",
          ingredientId: 11,
          confidence: 0.82,
          needsReview: false,
        },
      ],
      reviewOnly: true,
    });
    mockGetRecipeAssistant.mockResolvedValue({
      cards: [
        {
          type: "recipeSteps",
          title: "Tayyorlash qadamlari",
          items: [{ body: "Guruchni yuving." }],
        },
      ],
    });
    mockGetSubstitutions.mockResolvedValue({
      substitutions: [
        {
          replacementIngredientId: 2,
          replacementName: "Tovuq filesi",
          deltaUzS: -8000,
          macroDelta: { calories: -170, protein: 10 },
          safety: { reason: "No excluded allergen tags matched." },
        },
      ],
    });
  });

  it("supports manual pantry, scan review, recipe assistant, and UZS substitutions", async () => {
    render(
      <NutritionAiAssistantPanel currentPlan={{ name: "30 kunlik reja" }} />,
    );

    expect(screen.getByText("Ombor")).toBeInTheDocument();
    expect(screen.getByText("30 kunlik reja")).toBeInTheDocument();
    expect(screen.getByText("Guruch")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nomi"), {
      target: { value: "Tuxum" },
    });
    fireEvent.change(screen.getByLabelText("Miqdor"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Qo'shish/i }));

    await waitFor(() => {
      expect(mockCreatePantryItem).toHaveBeenCalledWith({
        name: "Tuxum",
        quantity: 10,
        unit: "dona",
      });
    });

    fireEvent.change(screen.getByLabelText(/Rasm scan/i), {
      target: {
        files: [new File(["image"], "ombor.jpg", { type: "image/jpeg" })],
      },
    });

    expect(await screen.findByText("kartoshka")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tasdiqlash" }));

    await waitFor(() => {
      expect(mockCreatePantryItem).toHaveBeenCalledWith({
        ingredientId: 11,
        name: "kartoshka",
        quantity: 1,
        unit: "dona",
      });
    });

    fireEvent.change(screen.getByLabelText("Recipe assistant"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI" }));

    expect(await screen.findByText("Guruchni yuving.")).toBeInTheDocument();
    expect(mockGetRecipeAssistant).toHaveBeenCalledWith({ foodId: 20 });

    fireEvent.change(screen.getByLabelText("UZS substitution"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Substitution grams"), {
      target: { value: "200" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Topish/i }));

    expect(await screen.findByText("Tovuq filesi")).toBeInTheDocument();
    expect(screen.getByText(/-8/)).toHaveTextContent("UZS");
    expect(mockGetSubstitutions).toHaveBeenCalledWith({
      ingredientId: 1,
      grams: 200,
    });

    fireEvent.click(screen.getByRole("button", { name: "Guruchni o'chirish" }));
    expect(mockDeletePantryItem).toHaveBeenCalledWith("pantry-1");
  });
});
