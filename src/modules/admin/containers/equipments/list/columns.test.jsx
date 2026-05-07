import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useColumns } from "./columns.jsx";

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }) => (
    <button
      type="button"
      aria-label="toggle"
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

vi.mock("@/components/reui/data-grid", () => ({
  DataGridTableDndRowHandle: () => <span data-testid="row-handle" />,
}));

vi.mock("@/modules/admin/components/admin-list-skeletons.jsx", () => ({
  adminListSkeletons: {
    action: null,
    avatarText: null,
    image: null,
    status: null,
    translations: null,
  },
}));

vi.mock("./actions-menu.jsx", () => ({
  default: () => null,
}));

const equipmentFixture = {
  id: 7,
  name: "Dumbbell",
  translations: { uz: "Gantel" },
  isActive: true,
  isOnboarding: true,
  isHome: false,
  isStreet: true,
};

const renderEquipmentSwitch = (accessorKey, equipmentOverrides = {}) => {
  const handlers = {
    handleToggleOnboarding: vi.fn(),
    handleToggleHome: vi.fn(),
    handleToggleStreet: vi.fn(),
    handleToggleStatus: vi.fn(),
  };

  function Harness() {
    const columns = useColumns({
      activeLanguages: [],
      currentLanguage: "uz",
      isReorderEnabled: false,
      openEditDrawer: vi.fn(),
      openTranslationsDrawer: vi.fn(),
      setEquipmentToDelete: vi.fn(),
      ...handlers,
    });
    const column = columns.find((item) => item.accessorKey === accessorKey);

    return (
      <div>
        {column.cell({
          row: {
            original: {
              ...equipmentFixture,
              ...equipmentOverrides,
            },
          },
        })}
      </div>
    );
  }

  render(<Harness />);
  return handlers;
};

describe("equipment admin list columns", () => {
  it("delegates the home visibility switch to the home toggle handler", () => {
    const handlers = renderEquipmentSwitch("isHome", { isHome: false });

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    expect(handlers.handleToggleHome).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      true,
    );
  });

  it("delegates the street visibility switch to the street toggle handler", () => {
    const handlers = renderEquipmentSwitch("isStreet", { isStreet: true });

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));

    expect(handlers.handleToggleStreet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      false,
    );
  });
});
