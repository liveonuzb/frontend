import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import CoachMobileNav from "./mobile-nav.jsx";

describe("CoachMobileNav", () => {
  it("shows only the minimal coach sections", () => {
    render(
      <MemoryRouter initialEntries={["/coach/dashboard"]}>
        <CoachMobileNav />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("Boshqaruv")).toBeInTheDocument();
    expect(screen.getByTitle("Mijozlar")).toBeInTheDocument();
    expect(screen.getByTitle("Chat")).toBeInTheDocument();
    expect(screen.getByTitle("To'lovlar")).toBeInTheDocument();
    expect(screen.getByTitle("Telegram")).toBeInTheDocument();

    expect(screen.queryByTitle("Kurslar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Ovqatlanish")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Workout")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Telegram bot")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Guruhlar")).not.toBeInTheDocument();
  });
});
