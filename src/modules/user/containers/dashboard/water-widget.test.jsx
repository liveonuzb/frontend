import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WaterWidget from "./water-widget.jsx";
import { useGetQuery, usePostQuery } from "@/hooks/api";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
  usePostQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/modules/user/containers/water/quick-cup-drawer", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("Dashboard WaterWidget", () => {
  beforeEach(() => {
    vi.mocked(useGetQuery).mockReturnValue({ data: null });
    vi.mocked(usePostQuery).mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("uses the animated themed water card with a fully rounded add button", () => {
    render(
      <MemoryRouter>
        <WaterWidget
          dateKey="2026-05-14"
          dayData={{
            waterLog: [{ amountMl: 500 }, { amountMl: 250 }],
            meals: {},
          }}
          goalsState={{
            goals: { waterMl: 2900, cupSize: 250 },
          }}
          compact
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Suv ichish")).toBeInTheDocument();
    expect(screen.getByText("750")).toBeInTheDocument();
    expect(screen.getByText("/ 2900 ml")).toBeInTheDocument();
    expect(
      screen.getByText("Suv ichish").closest("[data-slot=card]"),
    ).toHaveClass("water-widget");
    expect(screen.getByLabelText("Suv qo'shish")).toHaveClass("rounded-full");
  });
});
