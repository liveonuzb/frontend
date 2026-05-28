import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionHistoryPage from "./index.jsx";

const mocks = vi.hoisted(() => ({
  addMeal: vi.fn(),
  useDailyTrackingHistory: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  getTodayKey: () => "2026-05-25",
  useDailyTrackingActions: () => ({ addMeal: mocks.addMeal }),
  useDailyTrackingHistory: (...args) => mocks.useDailyTrackingHistory(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const expectBefore = (first, second) => {
  expect(
    Boolean(
      first.compareDocumentPosition(second) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBe(true);
};

const LocationEcho = () => {
  const location = useLocation();
  return <div>Nutrition Overview {location.search}</div>;
};

const renderHistory = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/history"]}>
      <Routes>
        <Route path="/user/nutrition/history" element={<NutritionHistoryPage />} />
        <Route path="/user/nutrition/overview" element={<LocationEcho />} />
      </Routes>
    </MemoryRouter>,
  );

describe("NutritionHistoryPage", () => {
  beforeEach(() => {
    mocks.addMeal.mockResolvedValue({});
    mocks.useDailyTrackingHistory.mockReturnValue({
      days: [
        {
          date: "2026-05-20",
          goals: { calories: 2100 },
          waterLog: [{ id: "water-1", amountMl: 500 }],
          meals: {
            breakfast: [
              {
                id: "meal-breakfast",
                name: "Qatiq",
                cal: 120,
                protein: 8,
                carbs: 12,
                fat: 4,
                addedAt: "2026-05-20T08:15:00",
              },
            ],
            lunch: [
              {
                id: "meal-lunch",
                name: "Osh",
                cal: 650,
                protein: 22,
                carbs: 78,
                fat: 24,
                addedAt: "2026-05-20T13:05:00",
              },
            ],
            dinner: [],
            snack: [],
          },
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders meals inside each day as a time ordered timeline", () => {
    renderHistory();

    expect(screen.queryByText("Ovqatlanish")).not.toBeInTheDocument();
    expect(screen.queryByText("O'rtacha kaloriya")).not.toBeInTheDocument();
    expect(screen.queryByText("Eng yaxshi seriya")).not.toBeInTheDocument();
    expect(screen.queryByText("O'rtacha suv")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Export$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter/i })).toBeInTheDocument();
    expect(screen.getAllByText(/20-may/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/chorshanba/i)).toBeInTheDocument();
    expect(screen.getByText("2 ta ovqat")).toBeInTheDocument();

    const qatiq = screen.getByText("Qatiq");
    const osh = screen.getByText("Osh");
    expectBefore(qatiq, osh);
    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.getByText("13:05")).toBeInTheDocument();
    expect(screen.getByText("Nonushta")).toBeInTheDocument();
    expect(screen.getByText("Tushlik")).toBeInTheDocument();
  });

  it("copies a timeline meal to today without leaving history", async () => {
    renderHistory();

    fireEvent.click(
      screen.getByRole("button", { name: /Osh bugunga qo'shish/i }),
    );

    expect(mocks.addMeal).toHaveBeenCalledWith(
      "2026-05-25",
      "lunch",
      expect.objectContaining({
        id: undefined,
        name: "Osh",
        source: "history-copy",
        addedAt: undefined,
      }),
    );
  });

  it("shows a clear empty timeline row for days without meals", () => {
    mocks.useDailyTrackingHistory.mockReturnValueOnce({
      days: [
        {
          date: "2026-05-19",
          goals: { calories: 2100 },
          waterLog: [],
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
          },
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderHistory();

    const dayCard = screen.getByRole("button", { name: /19-may/i });
    expect(within(dayCard).getByText("Bu kunda ovqat yozilmagan")).toBeInTheDocument();
  });

  it("opens a history day in nutrition overview with the selected date", () => {
    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /20-may/i }));

    expect(screen.getByText("Nutrition Overview ?date=2026-05-20")).toBeInTheDocument();
  });

  it("opens filters, date drawers, and meal type drawer from bottom drawer controls", () => {
    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("History filterlari");
    expect(screen.getByRole("button", { name: /Boshlanish sanasi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tugash sanasi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bo'lim/i })).toHaveTextContent("Barcha bo'limlar");
    expect(screen.getByPlaceholderText("Ovqat nomi...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Boshlanish sanasi/i }));
    expect(screen.getAllByText("Boshlanish sanasi").length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Bugun" }));

    fireEvent.click(screen.getByRole("button", { name: /Bo'lim/i }));
    expect(screen.getByText("Bo'limni tanlang")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tushlik" })).toBeInTheDocument();
  });
});
