import React from "react";
import "@/lib/i18n";
import i18n from "@/lib/i18n";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssignWorkoutTemplateDrawer } from "./assign-workout-template-drawer.jsx";

const template = {
  id: "template-1",
  name: "Starter split",
  days: 28,
  daysPerWeek: 3,
};

const users = [
  {
    id: "user-1",
    email: "ali@example.com",
    phone: "+998901112233",
    profile: { firstName: "Ali", lastName: "Valiyev" },
  },
  {
    id: "user-2",
    phone: "+998901234567",
    profile: { firstName: "Madina", lastName: "Karimova" },
  },
];

describe("AssignWorkoutTemplateDrawer", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("submits selected user assignment payload", () => {
    const onAssign = vi.fn();

    render(
      <AssignWorkoutTemplateDrawer
        open
        onOpenChange={vi.fn()}
        template={template}
        users={users}
        isAssigning={false}
        isLoadingUsers={false}
        onAssign={onAssign}
      />,
    );

    fireEvent.change(screen.getByLabelText("User"), {
      target: { value: "user-2" },
    });
    fireEvent.change(screen.getByLabelText("Schedule date"), {
      target: { value: "2026-05-20T09:00" },
    });
    fireEvent.change(screen.getByLabelText("Assignment note"), {
      target: { value: "Start tomorrow" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign workout" }));

    expect(onAssign).toHaveBeenCalledWith({
      userId: "user-2",
      templateId: "template-1",
      scheduledFor: "2026-05-20T09:00",
      notes: "Start tomorrow",
    });
  });

  it("keeps submit disabled until a user is selected", () => {
    render(
      <AssignWorkoutTemplateDrawer
        open
        onOpenChange={vi.fn()}
        template={template}
        users={users}
        isAssigning={false}
        isLoadingUsers={false}
        onAssign={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Assign workout" }),
    ).toBeDisabled();
  });
});
