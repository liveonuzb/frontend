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
  DrawerDescription: ({ children, className }) => (
    <p className={className} data-slot="drawer-description">
      {children}
    </p>
  ),
  DrawerFooter: ({ children, className }) => (
    <footer className={className}>{children}</footer>
  ),
  DrawerHeader: ({ children, className }) => (
    <header className={className}>{children}</header>
  ),
  DrawerTitle: ({ children, className }) => (
    <h2 className={className} data-slot="drawer-title">
      {children}
    </h2>
  ),
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

  it("uses compact weekday labels and 4px day gaps", () => {
    render(
      <CalendarBottomDrawer
        open
        date={new Date("2026-05-22T09:00:00")}
        onChange={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    const classNames = calendarPropsSpy.mock.calls.at(-1)[0].classNames;

    expect(classNames.weekdays).toContain("gap-1");
    expect(classNames.weekday).toContain("text-xs");
    expect(classNames.weekday).toContain("font-medium");
    expect(classNames.weekday).not.toContain("font-semibold");
    expect(classNames.week).toContain("gap-1");
  });

  it("keeps drawer title and description on default styles", () => {
    render(
      <CalendarBottomDrawer
        open
        date={new Date("2026-05-22T09:00:00")}
        onChange={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    expect(document.querySelector('[data-slot="drawer-title"]')).not.toHaveClass(
      "text-xl",
    );
    expect(
      document.querySelector('[data-slot="drawer-description"]'),
    ).not.toHaveClass("text-base");
  });

  it("keeps the bottom drawer at mobile width", () => {
    render(
      <CalendarBottomDrawer
        open
        date={new Date("2026-05-22T09:00:00")}
        onChange={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    const drawerContent = document.querySelector(
      '[data-calendar-bottom-drawer="true"]',
    );

    expect(drawerContent).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:!w-[min(100vw,28rem)]",
    );
    expect(drawerContent).toHaveClass(
      "data-[vaul-drawer-direction=bottom]:!max-w-md",
    );
    expect(drawerContent).not.toHaveClass(
      "data-[vaul-drawer-direction=bottom]:max-w-none",
    );
  });
});
