import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarBottomDrawer from "./calendar-bottom-drawer.jsx";

const calendarPropsSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }) =>
    open ? <div data-testid="drawer-root">{children}</div> : null,
  DrawerBody: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DrawerContent: ({ children, ...props }) => (
    <section {...props}>{children}</section>
  ),
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children, className }) => (
    <footer className={className}>{children}</footer>
  ),
  DrawerHeader: ({ children, className }) => (
    <header className={className}>{children}</header>
  ),
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: (props) => {
    calendarPropsSpy(props);

    return (
      <button
        type="button"
        onClick={() => props.onSelect(new Date("2026-05-10T12:00:00"))}
      >
        Select May 10
      </button>
    );
  },
}));

describe("CalendarBottomDrawer", () => {
  it("updates the selected date and closes after selecting a day", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <CalendarBottomDrawer
        open
        date={new Date("2026-05-22T09:00:00")}
        onChange={onChange}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.queryByText("Yopish")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Select May 10"));

    const selectedDate = onChange.mock.calls[0][0];

    expect(selectedDate.getFullYear()).toBe(2026);
    expect(selectedDate.getMonth()).toBe(4);
    expect(selectedDate.getDate()).toBe(10);
    expect(selectedDate.getHours()).toBe(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("styles selected day with a border and today with a dot", () => {
    render(
      <CalendarBottomDrawer
        open
        date={new Date("2026-05-22T09:00:00")}
        onChange={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    const classNames = calendarPropsSpy.mock.calls[0][0].classNames;

    expect(classNames.day_button).toContain(
      "data-[selected-single=true]:border-primary",
    );
    expect(classNames.day_button).toContain(
      "data-[selected-single=true]:bg-transparent",
    );
    expect(classNames.today).toContain("after:size-1.5");
    expect(classNames.today).toContain("after:bg-primary");
  });
});
