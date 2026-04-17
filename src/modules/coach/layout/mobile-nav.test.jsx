import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import CoachMobileNav from "./mobile-nav.jsx";

describe("CoachMobileNav", () => {
  it("shows only the minimal CRM sections", () => {
    render(
      <MemoryRouter initialEntries={["/coach/dashboard"]}>
        <CoachMobileNav />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Mijozlar")).toBeInTheDocument();
    expect(screen.getByText("Ovqatlanish")).toBeInTheDocument();
    expect(screen.getByText("Workout")).toBeInTheDocument();
    expect(screen.getByText("To'lovlar")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();

    expect(screen.queryByText("Kurslar")).not.toBeInTheDocument();
    expect(screen.queryByText("Paketlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Do'kon")).not.toBeInTheDocument();
    expect(screen.queryByText("Chat")).not.toBeInTheDocument();
  });
});
