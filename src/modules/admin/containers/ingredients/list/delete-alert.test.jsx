import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IngredientDeleteAlert from "./delete-alert.jsx";

describe("admin ingredient delete alert", () => {
  it("blocks delete until deletion impact counts are visible", () => {
    const onConfirm = vi.fn();

    render(
      <IngredientDeleteAlert
        ingredient={{ id: 1, name: "Guruch" }}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
        isLoadingImpact
        impact={null}
      />,
    );

    const confirmButton = screen.getByRole("button", {
      name: "Trashga yuborish",
    });

    expect(screen.getByText("Impact hisoblanmoqda...")).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();

    fireEvent.click(confirmButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows ingredient dependency impact counts before delete", () => {
    const onConfirm = vi.fn();

    render(
      <IngredientDeleteAlert
        ingredient={{ id: 1, name: "Guruch" }}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
        isLoadingImpact={false}
        impact={{
          totalIngredients: 1,
          activeCount: 1,
          trashedCount: 0,
          dependencies: {
            recipes: 2,
            shoppingLists: 4,
          },
        }}
      />,
    );

    expect(screen.getByText("Jami: 1")).toBeInTheDocument();
    expect(screen.getByText("Active: 1")).toBeInTheDocument();
    expect(screen.getByText("Trash: 0")).toBeInTheDocument();
    expect(screen.getByText("recipes")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("shoppingLists")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trashga yuborish" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
