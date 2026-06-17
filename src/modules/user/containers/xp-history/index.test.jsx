import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import XpHistoryPage from "./index.jsx";

const historyPages = {
  0: [
    {
      id: "xp-1",
      type: "MEAL_LOG",
      amount: 10,
      balance: 2450,
      note: "Ovqat qayd qilindi",
      createdAt: "2026-05-24T08:10:00.000Z",
    },
    {
      id: "xp-2",
      type: "XP_SPEND",
      amount: -50,
      balance: 2440,
      note: "Streak tiklandi",
      createdAt: "2026-05-23T12:30:00.000Z",
    },
  ],
  20: [
    {
      id: "xp-3",
      type: "WATER_LOG",
      amount: 5,
      balance: 2495,
      note: "Suv qayd qilindi",
      createdAt: "2026-05-22T09:00:00.000Z",
    },
  ],
};

const useGetQueryMock = vi.fn();
const setBreadcrumbsMock = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => useGetQueryMock(options),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: setBreadcrumbsMock }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <XpHistoryPage />
    </MemoryRouter>,
  );

describe("XpHistoryPage", () => {
  beforeEach(() => {
    setBreadcrumbsMock.mockReset();
    useGetQueryMock.mockReset();
    useGetQueryMock.mockImplementation(({ params }) => {
      const offset = params?.offset ?? 0;
      return {
        data: {
          data: {
            data: {
              items: historyPages[offset] ?? [],
              total: 21,
            },
          },
        },
        isLoading: false,
      };
    });
  });

  it("renders all XP logs from the history API and loads the next page on scroll", async () => {
    renderPage();

    expect(await screen.findByText("XP tarixi")).toBeInTheDocument();
    expect(screen.getByText("Ovqat qayd qilindi")).toBeInTheDocument();
    expect(screen.getByText("Streak tiklandi")).toBeInTheDocument();
    expect(screen.getByText("+10 XP")).toBeInTheDocument();
    expect(screen.getByText("-50 XP")).toBeInTheDocument();
    expect(screen.getByText("Balans: 2,450 XP")).toBeInTheDocument();
    expect(useGetQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/gamification/xp/history",
        params: { limit: 20, offset: 0 },
      }),
    );

    const scroller = screen.getByTestId("xp-history-scroll");
    Object.defineProperties(scroller, {
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 800 },
      scrollTop: { configurable: true, value: 380 },
    });
    fireEvent.scroll(scroller);

    await waitFor(() => {
      expect(screen.getByText("Suv qayd qilindi")).toBeInTheDocument();
    });
    expect(useGetQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "/user/gamification/xp/history",
        params: { limit: 20, offset: 20 },
      }),
    );
  });
});
