import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

describe("admin food delete alerts", () => {
  it("blocks soft delete until deletion impact counts are visible", () => {
    const onConfirm = vi.fn();

    render(
      <DeleteAlert
        food={{ id: 1, name: "Osh" }}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        impact={null}
        isLoadingImpact
        isDeleting={false}
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

  it("shows food dependency impact counts before hard delete", () => {
    const onConfirm = vi.fn();

    render(
      <HardDeleteAlert
        target={{ ids: [1, 2], label: "2 foods" }}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
        isLoadingImpact={false}
        impact={{
          totalFoods: 2,
          activeCount: 1,
          trashedCount: 1,
          recipeFoodCount: 1,
          dependencies: {
            recipes: 3,
            templates: 2,
          },
        }}
      />,
    );

    expect(screen.getByText("Jami: 2")).toBeInTheDocument();
    expect(screen.getByText("Active: 1")).toBeInTheDocument();
    expect(screen.getByText("Trash: 1")).toBeInTheDocument();
    expect(screen.getByText("Recipe: 1")).toBeInTheDocument();
    expect(screen.getByText("recipes")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("templates")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Butunlay o'chirish" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
