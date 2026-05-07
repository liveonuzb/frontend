import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { useUnsavedChangesGuard } from "./unsaved-changes-guard.jsx";

const GuardProbe = ({ when, onLeave = vi.fn() }) => {
  const guard = useUnsavedChangesGuard({ when });

  return (
    <div>
      <span data-testid="confirm-open">{String(guard.confirmOpen)}</span>
      <button type="button" onClick={() => guard.requestLeave(onLeave)}>
        leave
      </button>
    </div>
  );
};

describe("useUnsavedChangesGuard", () => {
  it("does not require a data router when rendered under BrowserRouter", () => {
    const onLeave = vi.fn();

    render(
      <BrowserRouter>
        <GuardProbe when onLeave={onLeave} />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "leave" }));

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.getByTestId("confirm-open")).toHaveTextContent("true");
  });

  it("runs manual leave actions immediately when guard is disabled", () => {
    const onLeave = vi.fn();

    render(
      <BrowserRouter>
        <GuardProbe when={false} onLeave={onLeave} />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "leave" }));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("confirm-open")).toHaveTextContent("false");
  });
});
