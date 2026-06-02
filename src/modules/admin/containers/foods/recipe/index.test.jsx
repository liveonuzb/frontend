import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FoodRecipeDrawer from "./index.jsx";

const mockPatchMutateAsync = vi.fn();

const foodFixture = {
  id: 12,
  name: "Mastava",
  translations: { uz: "Mastava" },
  recipeItems: [
    {
      ingredientId: 1,
      grams: "150",
      orderKey: "1024",
    },
  ],
  recipeInstructions: [
    {
      id: 1,
      language: "uz",
      stepNumber: 1,
      title: "Tayyorlash",
      body: "Guruchni yuving.",
      durationMinutes: 5,
      mediaUrl: "https://cdn.liveon.test/old-step.mp4",
      orderKey: "1024",
    },
  ],
};

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: { data: foodFixture },
    isLoading: false,
  }),
  usePatchQuery: () => ({
    mutateAsync: mockPatchMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/store", () => ({
  useLanguageStore: (selector) =>
    selector({
      currentLanguage: "uz",
    }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }) => <section>{children}</section>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
  DrawerBody: ({ children }) => <main>{children}</main>,
}));

vi.mock("@/components/option-drawer-picker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      aria-label={placeholder || "Ingredient"}
      value={value ?? ""}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      <option value="1">Guruch</option>
    </select>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

const renderDrawer = () =>
  render(
    <MemoryRouter initialEntries={["/admin/foods/12/recipe"]}>
      <Routes>
        <Route path="/admin/foods/:id/recipe" element={<FoodRecipeDrawer />} />
        <Route path="/admin/foods/list" element={<div>Foods list</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("FoodRecipeDrawer", () => {
  beforeEach(() => {
    mockPatchMutateAsync.mockReset();
    mockPatchMutateAsync.mockResolvedValue({ data: { data: {} } });
  });

  it("authors instruction steps with duration and media URL in recipe payload", async () => {
    renderDrawer();

    expect(screen.getByText("Tayyorlash qadamlari")).toBeInTheDocument();
    expect(screen.getByLabelText("1-qadam matn")).toHaveValue(
      "Guruchni yuving.",
    );

    fireEvent.change(screen.getByLabelText("1-qadam media URL"), {
      target: { value: " https://cdn.liveon.test/mastava-step-1.mp4 " },
    });

    fireEvent.click(screen.getByRole("button", { name: /Qadam qo'shish/i }));
    fireEvent.change(screen.getByLabelText("2-qadam matn"), {
      target: { value: "Issiq holda suzing." },
    });
    fireEvent.change(screen.getByLabelText("2-qadam davomiyligi"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Recipe saqlash/i }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith({
        url: "/admin/foods/12/recipe",
        attributes: {
          ingredients: [
            {
              ingredientId: 1,
              grams: 150,
              orderKey: 1024,
            },
          ],
          instructions: [
            {
              language: "uz",
              stepNumber: 1,
              title: "Tayyorlash",
              body: "Guruchni yuving.",
              durationMinutes: 5,
              mediaUrl: "https://cdn.liveon.test/mastava-step-1.mp4",
              orderKey: 1024,
            },
            {
              language: "uz",
              stepNumber: 2,
              body: "Issiq holda suzing.",
              durationMinutes: 3,
              orderKey: 2048,
            },
          ],
        },
      });
    });
  });
});
