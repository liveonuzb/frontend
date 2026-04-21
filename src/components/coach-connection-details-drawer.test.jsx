import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CoachConnectionDetailsDrawer from "./coach-connection-details-drawer";

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }) => <div>{children}</div>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  AlertDialogAction: ({ children }) => <button>{children}</button>,
  AlertDialogCancel: ({ children }) => <button>{children}</button>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }) => <footer>{children}</footer>,
  AlertDialogHeader: ({ children }) => <header>{children}</header>,
  AlertDialogTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/hooks/app/use-coach-invitations", () => ({
  useCoachInvitations: () => ({
    disconnectCoach: vi.fn(),
    isDisconnecting: false,
  }),
}));

vi.mock("@/hooks/app/use-user-coach-sessions", () => ({
  useUserCoachSessions: () => ({
    upcomingSessions: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    post: vi.fn(),
  },
}));

const renderDrawer = (coachConnection) =>
  render(
    <MemoryRouter>
      <CoachConnectionDetailsDrawer
        open
        onOpenChange={vi.fn()}
        coachConnection={coachConnection}
        onDisconnected={vi.fn()}
      />
    </MemoryRouter>,
  );

describe("CoachConnectionDetailsDrawer", () => {
  it("keeps hook order stable when coach connection appears and disappears", () => {
    const { rerender } = renderDrawer(null);

    rerender(
      <MemoryRouter>
        <CoachConnectionDetailsDrawer
          open
          onOpenChange={vi.fn()}
          coachConnection={{
            id: "coach-1",
            name: "Ali Coach",
            specializations: ["fitness"],
          }}
          onDisconnected={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ali Coach")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CoachConnectionDetailsDrawer
          open
          onOpenChange={vi.fn()}
          coachConnection={null}
          onDisconnected={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Ali Coach")).not.toBeInTheDocument();
  });
});
