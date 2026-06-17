import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateShoppingList = vi.fn();
const mockUseMealPlanShoppingLists = vi.fn();
const mockUpdateShoppingListItemCheck = vi.fn();

vi.mock("@/hooks/app/use-meal-plan", () => ({
  mealPlanDaysToKanban: (days = []) =>
    days.reduce((result, day, index) => {
      result[`day-${day?.dayNumber || index + 1}`] = day?.meals || [];
      return result;
    }, {}),
  useGenerateMealPlanShoppingList: () => ({
    generateShoppingList: mockGenerateShoppingList,
    isGeneratingShoppingList: false,
  }),
  useMealPlanShoppingLists: (...args) => mockUseMealPlanShoppingLists(...args),
  useUpdateShoppingListItemCheck: () => ({
    updateShoppingListItemCheck: mockUpdateShoppingListItemCheck,
    isUpdatingShoppingListItem: false,
  }),
}));

import {
  ShoppingList,
  buildShoppingListPdfFileName,
} from "./shopping-list.jsx";
import {
  buildShoppingList,
  getPlanShoppingDays,
} from "./shopping-list-utils.js";

describe("shopping-list duration plans", () => {
  it("builds stable language-aware PDF filenames from the plan date range", () => {
    expect(
      buildShoppingListPdfFileName({
        plan: {
          name: "Balanslangan reja",
          startDate: "2026-05-01T00:00:00.000Z",
          durationDays: 7,
        },
        language: "uz",
      }),
    ).toBe("balanslangan-reja-uz-2026-05-01-2026-05-07.pdf");

    expect(
      buildShoppingListPdfFileName({
        plan: {
          name: "",
          durationDays: 30,
        },
        language: "ru",
      }),
    ).toBe("haftalik-menyu-ru-day-1-day-30.pdf");
  });

  it("returns an empty list before a plan is loaded", () => {
    expect(buildShoppingList(null)).toEqual([]);
  });

  it("uses every canonical day in a 30-day plan instead of only weekdays", () => {
    const weeklyKanban = {
      "day-1": [
        {
          id: "breakfast-1",
          items: [{ name: "Tuxum", cal: 100, grams: 50, unit: "g" }],
        },
      ],
      "day-8": [
        {
          id: "breakfast-8",
          items: [{ name: "Tuxum", cal: 120, grams: 60, unit: "g" }],
        },
      ],
      "day-30": [
        {
          id: "snack-30",
          items: [{ name: "Olma", cal: 80, grams: 100, unit: "g" }],
        },
      ],
    };

    expect(getPlanShoppingDays({ weeklyKanban, durationDays: 30 })).toEqual([
      { key: "day-1", label: "1-kun" },
      { key: "day-2", label: "2-kun" },
      { key: "day-3", label: "3-kun" },
      { key: "day-4", label: "4-kun" },
      { key: "day-5", label: "5-kun" },
      { key: "day-6", label: "6-kun" },
      { key: "day-7", label: "7-kun" },
      { key: "day-8", label: "8-kun" },
      { key: "day-9", label: "9-kun" },
      { key: "day-10", label: "10-kun" },
      { key: "day-11", label: "11-kun" },
      { key: "day-12", label: "12-kun" },
      { key: "day-13", label: "13-kun" },
      { key: "day-14", label: "14-kun" },
      { key: "day-15", label: "15-kun" },
      { key: "day-16", label: "16-kun" },
      { key: "day-17", label: "17-kun" },
      { key: "day-18", label: "18-kun" },
      { key: "day-19", label: "19-kun" },
      { key: "day-20", label: "20-kun" },
      { key: "day-21", label: "21-kun" },
      { key: "day-22", label: "22-kun" },
      { key: "day-23", label: "23-kun" },
      { key: "day-24", label: "24-kun" },
      { key: "day-25", label: "25-kun" },
      { key: "day-26", label: "26-kun" },
      { key: "day-27", label: "27-kun" },
      { key: "day-28", label: "28-kun" },
      { key: "day-29", label: "29-kun" },
      { key: "day-30", label: "30-kun" },
    ]);

    expect(buildShoppingList({ weeklyKanban, durationDays: 30 })).toEqual([
      expect.objectContaining({
        name: "Tuxum",
        count: 2,
        totalAmount: 110,
        totalCal: 220,
      }),
      expect.objectContaining({
        name: "Olma",
        count: 1,
        totalAmount: 100,
        totalCal: 80,
      }),
    ]);
  });

  it("builds shopping lists from sequential plan days", () => {
    const plan = {
      durationDays: 30,
      days: [
        {
          dayNumber: 1,
          meals: [
            {
              id: "breakfast-1",
              items: [{ name: "Tuxum", cal: 100, grams: 50, unit: "g" }],
            },
          ],
        },
        {
          dayNumber: 2,
          meals: [
            {
              id: "lunch-2",
              items: [{ name: "Mastava", cal: 220, grams: 350, unit: "g" }],
            },
          ],
        },
      ],
    };

    expect(getPlanShoppingDays(plan)).toEqual([
      { key: "day-1", label: "1-kun" },
      { key: "day-2", label: "2-kun" },
    ]);
    expect(buildShoppingList(plan)).toEqual([
      expect.objectContaining({
        name: "Mastava",
        count: 1,
        totalAmount: 350,
      }),
      expect.objectContaining({
        name: "Tuxum",
        count: 1,
        totalAmount: 50,
      }),
    ]);
  });
});

describe("ShoppingList backend generation", () => {
  beforeEach(() => {
    mockGenerateShoppingList.mockReset();
    mockUpdateShoppingListItemCheck.mockReset();
    mockUseMealPlanShoppingLists.mockReset();
    mockUseMealPlanShoppingLists.mockReturnValue({
      shoppingLists: [],
      latestShoppingList: null,
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("generates ingredient-aware shopping list from the backend when opened", async () => {
    mockGenerateShoppingList.mockResolvedValue({
      id: "shopping-list-1",
      planId: "plan-1",
      planName: "Balanslangan reja",
      priceContext: {
        currency: "UZS",
      },
      items: [
        {
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
          sources: [{ foodName: "Osh" }, { foodName: "Mosh oshi" }],
        },
      ],
      totals: {
        estimatedCost: 12800,
        currency: "UZS",
      },
      budget: {
        status: "over_budget",
        targetCost: 10000,
        estimatedCost: 12800,
        difference: 2800,
        usagePercent: 128,
        currency: "UZS",
      },
      familyBudget: {
        name: "Karimovlar oilasi",
        memberCount: 3,
        maxMembers: 4,
        familyEstimatedCost: 38400,
        familyTargetCost: 30000,
        familyDifference: 8400,
        status: "over_budget",
        currency: "UZS",
      },
    });

    render(
      <ShoppingList
        open
        onOpenChange={vi.fn()}
        plan={{
          id: "plan-1",
          name: "Balanslangan reja",
          weeklyKanban: {
            Dushanba: [
              {
                id: "lunch",
                items: [{ name: "Fallback ovqat", grams: 100, unit: "g" }],
              },
            ],
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(mockGenerateShoppingList).toHaveBeenCalledWith("plan-1");
    });

    expect(await screen.findByText("Guruch")).toBeInTheDocument();
    expect(screen.getByText("400 g")).toBeInTheDocument();
    expect(screen.getAllByText("12 800 UZS")[0]).toBeInTheDocument();
    expect(screen.getByText("Byudjetdan 2 800 UZS oshdi")).toBeInTheDocument();
    expect(screen.getByText("Oila (3 kishi): 38 400 UZS")).toBeInTheDocument();
    expect(screen.getByText("Oilaviy byudjetdan 8 400 UZS oshdi")).toBeInTheDocument();
    expect(screen.queryByText("Fallback ovqat")).not.toBeInTheDocument();
  });

  it("does not regenerate the same plan on every reopen", async () => {
    mockGenerateShoppingList.mockResolvedValue({
      id: "shopping-list-1",
      planId: "plan-1",
      items: [
        {
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
        },
      ],
      totals: {
        estimatedCost: 12800,
        currency: "UZS",
      },
    });
    const plan = {
      id: "plan-1",
      name: "Balanslangan reja",
      weeklyKanban: {},
    };
    const { rerender } = render(
      <ShoppingList open onOpenChange={vi.fn()} plan={plan} />,
    );

    await waitFor(() => {
      expect(mockGenerateShoppingList).toHaveBeenCalledTimes(1);
    });

    rerender(<ShoppingList open={false} onOpenChange={vi.fn()} plan={plan} />);
    rerender(<ShoppingList open onOpenChange={vi.fn()} plan={plan} />);

    await waitFor(() => {
      expect(mockGenerateShoppingList).toHaveBeenCalledTimes(1);
    });
  });

  it("regenerates the shopping list for the selected region and season", async () => {
    mockGenerateShoppingList.mockResolvedValue({
      id: "shopping-list-1",
      planId: "plan-1",
      priceContext: {
        currency: "UZS",
      },
      items: [
        {
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
        },
      ],
      totals: {
        estimatedCost: 12800,
        currency: "UZS",
      },
    });

    render(
      <ShoppingList
        open
        onOpenChange={vi.fn()}
        plan={{ id: "plan-1", name: "Balanslangan reja", weeklyKanban: {} }}
      />,
    );

    await waitFor(() => {
      expect(mockGenerateShoppingList).toHaveBeenCalledWith("plan-1");
    });

    mockGenerateShoppingList.mockClear();
    fireEvent.change(screen.getByLabelText("Hudud"), {
      target: { value: "samarqand" },
    });
    fireEvent.change(screen.getByLabelText("Mavsum"), {
      target: { value: "winter" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Qayta yaratish/i }),
    );

    await waitFor(() => {
      expect(mockGenerateShoppingList).toHaveBeenCalledWith("plan-1", {
        regionKey: "samarqand",
        season: "winter",
      });
    });
  });

  it("loads the latest saved shopping list with persisted checked items", async () => {
    mockUseMealPlanShoppingLists.mockReturnValue({
      shoppingLists: [
        {
          id: "shopping-list-1",
          planId: "plan-1",
          items: [
            {
              id: "item-rice",
              ingredientId: 1,
              name: "Guruch",
              grams: 400,
              unit: "g",
              estimatedCost: 12800,
              currency: "UZS",
              isChecked: true,
            },
          ],
          totals: {
            estimatedCost: 12800,
            currency: "UZS",
          },
        },
      ],
      latestShoppingList: {
        id: "shopping-list-1",
        planId: "plan-1",
        items: [
          {
            id: "item-rice",
            ingredientId: 1,
            name: "Guruch",
            grams: 400,
            unit: "g",
            estimatedCost: 12800,
            currency: "UZS",
            isChecked: true,
          },
        ],
        totals: {
          estimatedCost: 12800,
          currency: "UZS",
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(
      <ShoppingList
        open
        onOpenChange={vi.fn()}
        plan={{ id: "plan-1", name: "Balanslangan reja", weeklyKanban: {} }}
      />,
    );

    expect(await screen.findByText("Guruch")).toBeInTheDocument();
    expect(screen.getByText("(1/1)")).toBeInTheDocument();
    expect(mockGenerateShoppingList).not.toHaveBeenCalled();
  });

  it("switches between previous saved shopping lists and shows price coverage", async () => {
    const latestList = {
      id: "shopping-list-new",
      planId: "plan-1",
      priceContext: {
        regionKey: "tashkent",
        season: "winter",
        currency: "UZS",
      },
      items: [
        {
          id: "item-rice",
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
          priceSource: "regional",
          isChecked: true,
        },
        {
          id: "item-spice",
          ingredientId: 2,
          name: "Ziravor",
          grams: 30,
          unit: "g",
          estimatedCost: null,
          currency: "UZS",
          priceSource: "unknown",
          isChecked: false,
        },
      ],
      totals: {
        estimatedCost: 12800,
        knownItems: 1,
        unknownItems: 1,
        currency: "UZS",
      },
    };
    const previousList = {
      id: "shopping-list-old",
      planId: "plan-1",
      priceContext: {
        currency: "UZS",
      },
      items: [
        {
          id: "item-egg",
          ingredientId: 3,
          name: "Tuxum",
          grams: 240,
          unit: "g",
          estimatedCost: 9000,
          currency: "UZS",
          priceSource: "base",
          isChecked: false,
        },
      ],
      totals: {
        estimatedCost: 9000,
        knownItems: 1,
        unknownItems: 0,
        currency: "UZS",
      },
    };

    mockUseMealPlanShoppingLists.mockReturnValue({
      shoppingLists: [latestList, previousList],
      latestShoppingList: latestList,
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(
      <ShoppingList
        open
        onOpenChange={vi.fn()}
        plan={{ id: "plan-1", name: "Balanslangan reja", weeklyKanban: {} }}
      />,
    );

    expect(await screen.findByText("Guruch")).toBeInTheDocument();
    expect(screen.getByText("Toshkent / Qish")).toBeInTheDocument();
    expect(screen.getByText("1 aniq, 1 noma'lum")).toBeInTheDocument();
    expect(screen.getByText("Hududiy narx")).toBeInTheDocument();
    expect(screen.getByText("Narx manbasi noma'lum")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Saqlangan xarid ro'yxati"), {
      target: { value: "shopping-list-old" },
    });

    expect(screen.getByText("Tuxum")).toBeInTheDocument();
    expect(screen.getByText("1 aniq, 0 noma'lum")).toBeInTheDocument();
    expect(screen.getByText("Bazaviy narx")).toBeInTheDocument();
    expect(screen.queryByText("Guruch")).not.toBeInTheDocument();
    expect(mockGenerateShoppingList).not.toHaveBeenCalled();
  });

  it("persists item check state for generated shopping lists", async () => {
    mockGenerateShoppingList.mockResolvedValue({
      id: "shopping-list-1",
      planId: "plan-1",
      items: [
        {
          id: "item-rice",
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
          isChecked: false,
        },
      ],
      totals: {
        estimatedCost: 12800,
        currency: "UZS",
      },
    });
    mockUpdateShoppingListItemCheck.mockResolvedValue({
      id: "shopping-list-1",
      planId: "plan-1",
      items: [
        {
          id: "item-rice",
          ingredientId: 1,
          name: "Guruch",
          grams: 400,
          unit: "g",
          estimatedCost: 12800,
          currency: "UZS",
          isChecked: true,
        },
      ],
      totals: {
        estimatedCost: 12800,
        currency: "UZS",
      },
    });

    render(
      <ShoppingList
        open
        onOpenChange={vi.fn()}
        plan={{ id: "plan-1", name: "Balanslangan reja", weeklyKanban: {} }}
      />,
    );

    const checkbox = await screen.findByRole("checkbox", {
      name: /Guruch ni xarid qilingan deb belgilash/i,
    });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockUpdateShoppingListItemCheck).toHaveBeenCalledWith(
        "shopping-list-1",
        "item-rice",
        true,
      );
    });
  });
});
