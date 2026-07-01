import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StrippedCalendar from "./index.jsx";

describe("StrippedCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T10:00:00.000Z"));
    Element.prototype.scrollBy = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps calendar behavior while using compact day styling", () => {
    const onChange = vi.fn();
    const onLabelClick = vi.fn();

    render(
      <StrippedCalendar
        date={new Date("2026-06-13T12:00:00.000Z")}
        daysBack={7}
        onChange={onChange}
        onLabelClick={onLabelClick}
      />,
    );

    const selectedDay = screen.getByRole("button", { name: /Sh\s*13/i });
    expect(selectedDay).toHaveAttribute("aria-pressed", "true");
    expect(selectedDay).toHaveClass(
      "min-w-[42px]",
      "min-h-12",
      "rounded-xl",
      "px-1.5",
      "py-1.5",
      "shadow-none",
    );
    expect(selectedDay).toHaveClass("bg-primary", "text-primary-foreground");

    const selectedText = selectedDay.querySelector(".tabular-nums");
    expect(selectedText).toHaveClass("text-sm", "font-semibold");

    const selectedWeekday = selectedDay.querySelector("span");
    expect(selectedWeekday).toHaveClass(
      "text-[9px]",
      "font-medium",
      "tracking-normal",
    );

    const today = screen.getByRole("button", { name: /Ch\s*17/i });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveClass("bg-primary/10", "text-primary");
    expect(today).not.toHaveClass("border", "border-primary/25");

    fireEvent.click(selectedDay);
    expect(onLabelClick).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Yak\s*14/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const changedDay = onChange.mock.calls[0][0];
    expect(changedDay.getFullYear()).toBe(2026);
    expect(changedDay.getMonth()).toBe(5);
    expect(changedDay.getDate()).toBe(14);
  });
});
