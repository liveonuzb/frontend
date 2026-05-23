import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AchievementsWidget from "./achievements-widget.jsx";
import { useGetQuery } from "@/hooks/api";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

const achievements = [
  { id: "a1", name: "First", description: "First win", unlocked: true },
  { id: "a2", name: "Second", description: "Second win", unlocked: true },
  { id: "l1", name: "Locked 1", description: "Locked", unlocked: false },
  { id: "l2", name: "Locked 2", description: "Locked", unlocked: false },
  { id: "l3", name: "Locked 3", description: "Locked", unlocked: false },
  { id: "l4", name: "Locked 4", description: "Locked", unlocked: false },
  { id: "l5", name: "Locked 5", description: "Locked", unlocked: false },
  { id: "l6", name: "Locked 6", description: "Locked", unlocked: false },
];

describe("AchievementsWidget", () => {
  beforeEach(() => {
    vi.mocked(useGetQuery).mockReturnValue({
      data: { data: achievements },
    });
  });

  it("renders the compact achievements preview card", () => {
    render(
      <MemoryRouter>
        <AchievementsWidget />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Achievements/i })).toHaveAttribute(
      "href",
      "/user/achievements",
    );
    expect(
      screen.getByText("Achievements").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("2/8 ta achievement olingan")).toBeInTheDocument();
    expect(screen.getByLabelText("3 ta yopiq achievement")).toHaveTextContent(
      "+3",
    );
  });

  it("keeps the empty state inside the standard card shell", () => {
    vi.mocked(useGetQuery).mockReturnValue({ data: { data: [] } });

    render(
      <MemoryRouter>
        <AchievementsWidget />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Achievements").closest("[data-slot=card]"),
    ).toBeInTheDocument();
    expect(screen.getByText("0/0 ta achievement olingan")).toBeInTheDocument();
    expect(screen.getByText("Hali yutuq yo'q")).toBeInTheDocument();
  });
});
