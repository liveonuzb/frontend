import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PricePage from "./index.jsx";

const mockUseGetQuery = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockRefetch = vi.fn();

vi.mock("../components/utils.jsx", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    NumberInput: ({ value, onChange, step = 1 }) => (
      <input
        aria-label="numeric amount"
        type="number"
        step={step}
        value={value ?? 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    ),
  };
});

vi.mock("@/components/option-drawer-picker", () => ({
  default: ({ value, onChange, options, title, placeholder }) => (
    <select
      aria-label={title || placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => mockUseGetQuery(options),
  usePatchQuery: () => ({
    mutateAsync: mockPatch,
    isPending: false,
  }),
  useDeleteQuery: () => ({
    mutateAsync: mockDelete,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const ingredientFixture = {
  id: 12,
  name: "Guruch",
  priceAmount: 18000,
  priceUnit: "kg",
  currency: "UZS",
  budgetTier: "cheap",
  regionalPrices: [
    {
      id: "regional-1",
      regionName: "Toshkent",
      regionKey: "tashkent",
      season: "summer",
      pricePer100g: 2200,
      currency: "UZS",
      budgetTier: "medium",
    },
  ],
};

const renderPricePage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/ingredients/list/price/12"]}>
      <Routes>
        <Route
          path="/admin/ingredients/list/price/:id"
          element={<PricePage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("admin ingredient pricing editor", () => {
  beforeEach(() => {
    mockUseGetQuery.mockClear();
    mockPatch.mockReset();
    mockPatch.mockResolvedValue({});
    mockDelete.mockReset();
    mockDelete.mockResolvedValue({});
    mockRefetch.mockReset();
    mockUseGetQuery.mockReturnValue({
      data: { data: ingredientFixture },
      isLoading: false,
      refetch: mockRefetch,
    });
  });

  it("saves base prices, regional prices and regional price deletion", async () => {
    renderPricePage();

    expect(screen.getByText("Asosiy narx")).toBeInTheDocument();
    expect(screen.getByText(/Toshkent - Yoz/i)).toBeInTheDocument();
    expect(screen.getByText(/2 200 UZS\/100g/i)).toBeInTheDocument();

    const [baseAmount, regionalAmount] =
      screen.getAllByLabelText("numeric amount");

    fireEvent.change(baseAmount, { target: { value: "25000" } });
    fireEvent.change(screen.getAllByLabelText("Budget turi")[0], {
      target: { value: "medium" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith({
        url: "/admin/nutrition/ingredient-prices/12",
        attributes: {
          priceAmount: 25000,
          priceUnit: "kg",
          currency: "UZS",
          budgetTier: "medium",
        },
      });
    });

    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "tashkent" },
    });
    fireEvent.change(screen.getByLabelText("Season"), {
      target: { value: "summer" },
    });
    fireEvent.change(regionalAmount, { target: { value: "32000" } });
    fireEvent.change(screen.getAllByLabelText("Narx birligi")[1], {
      target: { value: "kg" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Region narxini saqlash/i }),
    );

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith({
        url: "/admin/nutrition/ingredient-prices/12/regional-prices",
        attributes: expect.objectContaining({
          regionKey: "tashkent",
          regionName: "Toshkent",
          season: "summer",
          priceAmount: 32000,
          priceUnit: "kg",
          currency: "UZS",
        }),
      });
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Toshkent summer region narxini o'chirish/i,
      }),
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({
        url: "/admin/nutrition/ingredient-prices/12/regional-prices/regional-1",
      });
    });
  });
});
