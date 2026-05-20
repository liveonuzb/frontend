import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminWorkoutPlanActionsMenu from "./workout-plan-actions-menu.jsx";

const approvedTemplate = {
  id: "template-1",
  name: "Upper split",
  isActive: true,
  approvalStatus: "approved",
};

const renderMenu = (props = {}) => {
  render(
    <AdminWorkoutPlanActionsMenu
      template={approvedTemplate}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onTranslations={vi.fn()}
      onAssign={vi.fn()}
      canAssign={false}
      {...props}
    />,
  );

  fireEvent.pointerDown(screen.getByRole("button", { name: "Amallar" }));
};

describe("AdminWorkoutPlanActionsMenu", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("uz");
  });

  it("hides assignment when the admin cannot manage workout assignments", () => {
    renderMenu({ canAssign: false });

    expect(screen.queryByRole("menuitem", { name: /assign/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /tahrirlash/i })).toBeInTheDocument();
  });

  it("shows assignment only for active approved templates", () => {
    renderMenu({ canAssign: true });

    expect(screen.getByRole("menuitem", { name: /assign/i })).toBeInTheDocument();
  });

  it("hides assignment for inactive or unapproved templates", () => {
    renderMenu({
      canAssign: true,
      template: {
        ...approvedTemplate,
        isActive: false,
      },
    });

    expect(screen.queryByRole("menuitem", { name: /assign/i })).not.toBeInTheDocument();
  });
});
