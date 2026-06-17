import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionHistoryPage from "./index.jsx";

const mocks = vi.hoisted(() => ({
  addMeal: vi.fn(),
  copyMeals: vi.fn(),
  requestGet: vi.fn(),
  patchMeal: vi.fn(),
  removeMeal: vi.fn(),
  useDailyTrackingHistory: vi.fn(),
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  default: () => ({
    request: {
      get: mocks.requestGet,
    },
  }),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  getTodayKey: () => "2026-05-25",
  useDailyTrackingActions: () => ({
    addMeal: mocks.addMeal,
    copyMeals: mocks.copyMeals,
    patchMeal: mocks.patchMeal,
    removeMeal: mocks.removeMeal,
  }),
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
    mocks.copyMeals.mockResolvedValue({});
    mocks.requestGet.mockResolvedValue({
      data: new Blob(["date,meal_type\n2026-05-20,lunch"], {
        type: "text/csv;charset=utf-8",
      }),
      headers: {
        "content-disposition":
          'attachment; filename="nutrition-history-2026-05-12-2026-05-25.csv"',
      },
    });
    mocks.patchMeal.mockResolvedValue({});
    mocks.removeMeal.mockResolvedValue({});
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
                source: "manual",
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
                source: "recipe",
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
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      refetch: vi.fn(),
    });
  });

  it("exports history through the backend canonical CSV endpoint", async () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:nutrition-history");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /Filtr/i }));
    fireEvent.click(screen.getByRole("button", { name: "14 kun" }));
    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi..."), {
      target: { value: "osh" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Manba/i }));
    fireEvent.click(screen.getByRole("button", { name: "Retsept" }));
    fireEvent.click(screen.getByRole("button", { name: /CSV yuklash/i }));

    await waitFor(() => {
      expect(mocks.requestGet).toHaveBeenCalledWith(
        "/user/nutrition/history/export",
        {
          params: {
            startDate: "2026-05-12",
            endDate: "2026-05-25",
            mealType: "all",
            source: "recipe",
            q: "osh",
          },
          responseType: "blob",
        },
      );
    });

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:nutrition-history");
    expect(anchorClick).toHaveBeenCalled();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    anchorClick.mockRestore();
  });

  it("renders meals inside each day as a time ordered timeline", () => {
    renderHistory();

    expect(screen.queryByText("Ovqatlanish")).not.toBeInTheDocument();
    expect(screen.queryByText("O'rtacha kaloriya")).not.toBeInTheDocument();
    expect(screen.queryByText("Eng yaxshi seriya")).not.toBeInTheDocument();
    expect(screen.queryByText("O'rtacha suv")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Export$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Filter/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filtr/i })).toBeInTheDocument();
    expect(screen.getAllByText(/20-may/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/chorshanba/i)).toBeInTheDocument();
    expect(screen.getByText("2 ta ovqat")).toBeInTheDocument();
    expect(screen.getByText("770 kcal")).toBeInTheDocument();
    expect(screen.getByText("30g")).toBeInTheDocument();
    expect(screen.getByText("90g")).toBeInTheDocument();
    expect(screen.getByText("28g")).toBeInTheDocument();
    expect(screen.getByText("500 ml")).toBeInTheDocument();
    expect(screen.getByText("37%")).toBeInTheDocument();
    expect(screen.getByText("Sog'liq 53/100")).toBeInTheDocument();

    const qatiq = screen.getByText("Qatiq");
    const osh = screen.getByText("Osh");
    expectBefore(qatiq, osh);
    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.getByText("13:05")).toBeInTheDocument();
    expect(screen.getByText("Nonushta")).toBeInTheDocument();
    expect(screen.getByText("Tushlik")).toBeInTheDocument();
    expect(screen.getByText("Retsept")).toBeInTheDocument();
  });

  it("copies a timeline meal to a selected date and meal type", async () => {
    renderHistory();

    fireEvent.click(
      screen.getByRole("button", { name: /Osh nusxa olish/i }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Ovqatdan nusxa olish");
    fireEvent.change(screen.getByLabelText("Nusxa sanasi"), {
      target: { value: "2026-05-24" },
    });
    fireEvent.change(screen.getByLabelText("Nusxa bo'limi"), {
      target: { value: "dinner" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^Nusxa olish$/i }),
    );

    await waitFor(() => {
      expect(mocks.addMeal).toHaveBeenCalledWith(
        "2026-05-24",
        "dinner",
        expect.objectContaining({
          name: "Osh",
          source: "history-copy",
          addedAt: undefined,
          cal: 650,
        }),
      );
    });
  });

  it("copies a history day to a selected date and optional meal type", async () => {
    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /^Nusxa$/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Kundan nusxa olish");
    fireEvent.change(screen.getByLabelText("Nusxa sanasi"), {
      target: { value: "2026-05-23" },
    });
    fireEvent.change(screen.getByLabelText("Nusxa bo'limi"), {
      target: { value: "breakfast" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^Nusxa olish$/i }),
    );

    await waitFor(() => {
      expect(mocks.copyMeals).toHaveBeenCalledWith({
        from: "2026-05-20",
        to: "2026-05-23",
        mealType: "breakfast",
      });
    });
  });

  it("edits timeline meal fields from the history drawer", async () => {
    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /Osh tahrirlash/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Ovqatni tahrirlash");
    fireEvent.change(screen.getByLabelText("Ovqat nomi"), {
      target: { value: "Yengil osh" },
    });
    fireEvent.change(screen.getByLabelText("Ovqat bo'limi"), {
      target: { value: "dinner" },
    });
    fireEvent.change(screen.getByLabelText("Ovqat vaqti"), {
      target: { value: "19:30" },
    });
    fireEvent.change(screen.getByLabelText("Kaloriya (kcal)"), {
      target: { value: "520" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Saqlash$/i }));

    await waitFor(() => {
      expect(mocks.patchMeal).toHaveBeenCalledWith(
        "2026-05-20",
        "dinner",
        "meal-lunch",
        expect.objectContaining({
          name: "Yengil osh",
          cal: 520,
          addedAt: "2026-05-20T19:30:00",
        }),
      );
    });
  });

  it("requires confirmation before deleting a timeline meal", async () => {
    renderHistory();

    fireEvent.click(screen.getByRole("button", { name: /Osh o'chirish/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Ovqatni o'chirish?");
    fireEvent.click(screen.getByRole("button", { name: /^O'chirish$/i }));

    await waitFor(() => {
      expect(mocks.removeMeal).toHaveBeenCalledWith(
        "2026-05-20",
        "lunch",
        "meal-lunch",
      );
    });
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
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
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

    fireEvent.click(screen.getByRole("button", { name: /Filtr/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Tarix filterlari");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("History");
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

  it("sends source, date preset, search, and pagination to backend history", async () => {
    mocks.useDailyTrackingHistory.mockReturnValue({
      days: [
        {
          date: "2026-05-20",
          goals: { calories: 2100 },
          waterLog: [],
          meals: {
            breakfast: [
              {
                id: "manual-meal",
                name: "Qatiq",
                source: "manual",
                cal: 120,
                addedAt: "2026-05-20T08:15:00",
              },
            ],
            lunch: [
              {
                id: "recipe-meal",
                name: "Osh",
                source: "recipe",
                cal: 650,
                addedAt: "2026-05-20T13:05:00",
              },
            ],
          },
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      meta: {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
      refetch: vi.fn(),
    });

    renderHistory();

    expect(mocks.useDailyTrackingHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: "all",
        page: 1,
        limit: 10,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));

    await waitFor(() => {
      expect(mocks.useDailyTrackingHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          source: "all",
          page: 2,
          limit: 10,
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /Filtr/i }));
    fireEvent.click(screen.getByRole("button", { name: "14 kun" }));
    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi..."), {
      target: { value: "osh" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Manba/i }));
    fireEvent.click(screen.getByRole("button", { name: "Retsept" }));

    await waitFor(() => {
      expect(mocks.useDailyTrackingHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          startDate: "2026-05-12",
          endDate: "2026-05-25",
          source: "recipe",
          q: "osh",
          page: 1,
          limit: 10,
        }),
      );
    });
    expect(screen.queryByText("Qatiq")).not.toBeInTheDocument();
    expect(screen.getByText("Osh")).toBeInTheDocument();
  });

  it("separates no history from no filter results", async () => {
    mocks.useDailyTrackingHistory.mockReturnValue({
      days: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      refetch: vi.fn(),
    });

    renderHistory();

    expect(screen.getByText("Hali tarix yo'q")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Filtr/i }));
    fireEvent.change(screen.getByPlaceholderText("Ovqat nomi..."), {
      target: { value: "osh" },
    });

    await waitFor(() => {
      expect(screen.getByText("Natija topilmadi")).toBeInTheDocument();
    });
  });
});
